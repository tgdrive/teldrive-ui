import { useCallback, useMemo } from "react"
import { Message, ModalState, QueryParams, SetValue } from "@/types"
import {
  ChonkyActions,
  ChonkyActionUnion,
  ChonkyIconName,
  CustomVisibilityState,
  defineFileAction,
  FileHelper,
  MapFileActionsToData,
} from "@bhunter179/chonky"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useQueryClient } from "@tanstack/react-query"

import { useSession } from "@/hooks/useSession"
import {
  getExtension,
  getMediaUrl,
  navigateToExternalUrl,
} from "@/utils/common"
import { getPreviewType, preview } from "@/utils/getPreviewType"
import http from "@/utils/http"
import { usePreloadFiles } from "@/utils/queryOptions"

export const CustomActions = (isSm: boolean, type: string) => ({
  DownloadFile: defineFileAction({
    id: "download_file",
    requiresSelection: true,
    fileFilter: (file) => (file && "isDir" in file ? false : true),
    button: {
      name: "Download",
      contextMenu: true,
      icon: ChonkyIconName.download,
    },
  } as const),
  RenameFile: defineFileAction({
    id: "rename_file",
    requiresSelection: true,
    button: {
      name: "Rename",
      contextMenu: true,
      icon: ChonkyIconName.rename,
    },
  } as const),
  DeleteFile: defineFileAction({
    id: "delete_file",
    requiresSelection: true,
    button: {
      name: "Delete",
      contextMenu: true,
      icon: ChonkyIconName.trash,
    },
  } as const),
  OpenInVLCPlayer: defineFileAction({
    id: "open_vlc_player",
    requiresSelection: true,
    fileFilter: (file) =>
      file &&
      getPreviewType(getExtension(file.name)) === "video" &&
      !("isDir" in file)
        ? true
        : false,
    button: {
      name: "Open In VLC",
      contextMenu: true,
      icon: ChonkyIconName.play,
    },
  } as const),
  CopyDownloadLink: defineFileAction({
    id: "copy_link",
    requiresSelection: true,
    fileFilter: (file) => (file && "isDir" in file ? false : true),
    button: {
      name: "Copy Download Link",
      contextMenu: true,
      icon: ChonkyIconName.copy,
    },
  } as const),
  CreateFolder: defineFileAction({
    id: "create_folder",
    button: {
      name: "Create folder",
      tooltip: "Create a folder",
      toolbar: true,
      group: isSm ? "Actions" : "",
      icon: ChonkyIconName.folderCreate,
    },
    customVisibility: () =>
      type !== "my-drive"
        ? CustomVisibilityState.Hidden
        : CustomVisibilityState.Default,
  } as const),
  UploadFiles: defineFileAction({
    id: "upload_files",
    button: {
      name: "Upload files",
      tooltip: "Upload files",
      toolbar: true,
      group: isSm ? "Actions" : "",
      icon: ChonkyIconName.upload,
    },
    customVisibility: () =>
      type !== "my-drive"
        ? CustomVisibilityState.Hidden
        : CustomVisibilityState.Default,
  } as const),
  GoToFolder: defineFileAction({
    id: "go_to_folder",
    requiresSelection: true,
    button: {
      name: "Go to folder",
      tooltip: "Go to folder",
      contextMenu: true,
      icon: ChonkyIconName.folder,
    },
    customVisibility: () =>
      type != "my-drive"
        ? CustomVisibilityState.Default
        : CustomVisibilityState.Hidden,
  } as const),
})

type ChonkyActionFullUnion =
  | ReturnType<typeof CustomActions>[keyof ReturnType<typeof CustomActions>]
  | ChonkyActionUnion

export const useFileAction = (
  params: QueryParams,
  setModalState: SetValue<ModalState>,
  openUpload: () => void,
  openFileDialog: () => void
) => {
  const queryClient = useQueryClient()

  const isSm = useMediaQuery("(max-width:600px)")

  const preloadFiles = usePreloadFiles()

  const { data: session } = useSession()

  const { type } = params

  const fileActions = useMemo(
    () => CustomActions(isSm, params.type),
    [isSm, type]
  )

  const chonkyActionHandler = useCallback(() => {
    return async (data: MapFileActionsToData<ChonkyActionFullUnion>) => {
      switch (data.id) {
        case ChonkyActions.OpenFiles.id: {
          const { targetFile, files } = data.payload

          const fileToOpen = targetFile ?? files[0]

          if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
            preloadFiles(fileToOpen.path, "my-drive")
          }
          if (fileToOpen && fileToOpen.type === "file") {
            const previewType = fileToOpen.previewType as string
            if (!FileHelper.isDirectory(fileToOpen) && previewType in preview) {
              setModalState({
                open: true,
                currentFile: fileToOpen,
                operation: ChonkyActions.OpenFiles.id,
              })
            }
          }
          break
        }
        case fileActions.GoToFolder.id: {
          preloadFiles(data.state.selectedFiles[0].location, "my-drive")
          break
        }
        case fileActions.DownloadFile.id: {
          const { selectedFiles } = data.state
          for (const file of selectedFiles) {
            if (!FileHelper.isDirectory(file)) {
              const { id, name } = file
              const url = getMediaUrl(id, name, session?.hash!, true)
              navigateToExternalUrl(url, false)
            }
          }
          break
        }
        case fileActions.OpenInVLCPlayer.id: {
          const { selectedFiles } = data.state
          const fileToOpen = selectedFiles[0]
          const { id, name } = fileToOpen
          const url = `vlc://${getMediaUrl(id, name, session?.hash!)}`
          navigateToExternalUrl(url, false)
          break
        }
        case fileActions.RenameFile.id: {
          setModalState({
            open: true,
            currentFile: data.state.selectedFiles[0],
            operation: fileActions.RenameFile.id,
          })
          break
        }
        case fileActions.DeleteFile.id: {
          setModalState({
            open: true,
            selectedFiles: data.state.selectedFiles.map((item) => item.id),
            operation: fileActions.DeleteFile.id,
          })
          break
        }
        case ChonkyActions.CreateFolder.id: {
          setModalState({
            open: true,
            operation: ChonkyActions.CreateFolder.id,
          })
          break
        }
        case ChonkyActions.UploadFiles.id: {
          openUpload()
          openFileDialog()
          break
        }
        case fileActions.CopyDownloadLink.id: {
          const selections = data.state.selectedFilesForAction
          let clipboardText = ""
          selections.forEach((element) => {
            if (!FileHelper.isDirectory(element)) {
              const { id, name } = element
              clipboardText = `${clipboardText}${getMediaUrl(
                id,
                name,
                session?.hash!
              )}\n`
            }
          })
          navigator.clipboard.writeText(clipboardText)
          break
        }
        case ChonkyActions.MoveFiles.id: {
          const { files, destination } = data.payload
          let res = await http.post<Message>("/api/files/move", {
            files: files.map((file) => file.id),
            destination: destination.path || "/",
          })
          if (res.status === 200) {
            queryClient.invalidateQueries({
              queryKey: ["files"],
            })
          }
          break
        }
        case ChonkyActions.EnableGridView.id: {
          localStorage.setItem("view", "grid")
          break
        }

        case ChonkyActions.EnableListView.id: {
          localStorage.setItem("view", "list")
          break
        }
        default:
          break
      }
    }
  }, [type])

  return { fileActions, chonkyActionHandler }
}
