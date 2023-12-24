import { useCallback, useMemo } from "react"
import { Message, ModalState, SetValue } from "@/ui/types"
import {
  ChonkyActions,
  ChonkyActionUnion,
  ChonkyIconName,
  CustomVisibilityState,
  defineFileAction,
  FileHelper,
  MapFileActionsToData,
  SortOrder,
} from "@bhunter179/chonky"
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons/faArrowsRotate"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"

import { usePreloadFiles } from "@/ui/hooks/queryhooks"
import { useSession } from "@/ui/hooks/useSession"
import useSettings from "@/ui/hooks/useSettings"
import { useSortFilter } from "@/ui/hooks/useSortFilter"
import {
  getExtension,
  getMediaUrl,
  getParams,
  navigateToExternalUrl,
} from "@/ui/utils/common"
import { getPreviewType, preview } from "@/ui/utils/getPreviewType"
import http from "@/ui/utils/http"

const toggleSort = (sort: SortOrder) => {
  return sort === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
}

const sortMap = {
  [ChonkyActions.SortFilesByName.id]: "name",
  [ChonkyActions.SortFilesByDate.id]: "updatedAt",
  [ChonkyActions.SortFilesBySize.id]: "size",
} as const

export const CustomActions = {
  DownloadFile: defineFileAction({
    id: "download_file",
    requiresSelection: true,
    fileFilter: (file) => (file && "isDir" in file ? false : true),
    button: {
      name: "Download",
      contextMenu: true,
      icon: ChonkyIconName.download,
    },
  }),
  RenameFile: defineFileAction({
    id: "rename_file",
    requiresSelection: true,
    button: {
      name: "Rename",
      contextMenu: true,
      icon: ChonkyIconName.rename,
    },
  }),
  DeleteFile: defineFileAction({
    id: "delete_file",
    requiresSelection: true,
    button: {
      name: "Delete",
      contextMenu: true,
      icon: ChonkyIconName.trash,
    },
  }),
  SyncFiles: defineFileAction({
    id: "sync_files",
    button: {
      name: "Sync Files",
      toolbar: true,
      iconOnly: true,
      icon: faArrowsRotate,
    },
  }),
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
  }),
  CopyDownloadLink: defineFileAction({
    id: "copy_link",
    requiresSelection: true,
    fileFilter: (file) => (file && "isDir" in file ? false : true),
    button: {
      name: "Copy Download Link",
      contextMenu: true,
      icon: ChonkyIconName.copy,
    },
  }),
  CreateFolder: (group = "", path = "") =>
    defineFileAction({
      id: "create_folder",
      button: {
        name: "Create folder",
        tooltip: "Create a folder",
        toolbar: true,
        ...(group && { group }),
        icon: ChonkyIconName.folderCreate,
      },
      customVisibility: () =>
        path !== "my-drive"
          ? CustomVisibilityState.Hidden
          : CustomVisibilityState.Default,
    }),
  UploadFiles: (group = "", path = "") =>
    defineFileAction({
      id: "upload_files",
      button: {
        name: "Upload files",
        tooltip: "Upload files",
        toolbar: true,
        ...(group && { group }),
        icon: ChonkyIconName.upload,
      },
      customVisibility: () =>
        path !== "my-drive"
          ? CustomVisibilityState.Hidden
          : CustomVisibilityState.Default,
    }),
  GoToFolder: (path = "") =>
    defineFileAction({
      id: "go_to_folder",
      requiresSelection: true,
      button: {
        name: "Go to folder",
        tooltip: "Go to folder",
        contextMenu: true,
        icon: ChonkyIconName.folder,
      },
      customVisibility: () =>
        path != "my-drive"
          ? CustomVisibilityState.Default
          : CustomVisibilityState.Hidden,
    }),
}

export const useFileAction = (
  setModalState: SetValue<Partial<ModalState>>,
  openUpload: () => void,
  openFileDialog: () => void
) => {
  const params = getParams(useParams())

  const { type, path } = params

  const queryClient = useQueryClient()

  const isSm = useMediaQuery("(max-width:600px)")

  const { preloadFiles } = usePreloadFiles()

  const { sortFilter, setSortFilter } = useSortFilter()

  const { settings } = useSettings()

  const { data: session } = useSession()

  const fileActions = useMemo(
    () => [
      CustomActions.GoToFolder(type),
      CustomActions.DownloadFile,
      CustomActions.RenameFile,
      CustomActions.DeleteFile,
      CustomActions.CopyDownloadLink,
      CustomActions.OpenInVLCPlayer,
      CustomActions.SyncFiles,
      CustomActions.CreateFolder(isSm ? "Actions" : "", type),
      CustomActions.UploadFiles(isSm ? "Actions" : "", type),
    ],
    [isSm, type]
  )

  const chonkyActionHandler = useCallback(() => {
    return async (data: MapFileActionsToData<ChonkyActionUnion>) => {
      switch (data.id) {
        case ChonkyActions.OpenFiles.id: {
          const { targetFile, files } = data.payload

          const fileToOpen = targetFile ?? files[0]

          if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
            preloadFiles({ type: "my-drive", path: fileToOpen.path })
          }
          if (fileToOpen && fileToOpen.type === "file") {
            const previewType = getPreviewType(
              getExtension(fileToOpen.name)
            ) as string
            if (!FileHelper.isDirectory(fileToOpen) && previewType in preview) {
              setModalState({
                open: true,
                file: fileToOpen,
                operation: ChonkyActions.OpenFiles.id,
              })
            }
          }
          break
        }

        case "go_to_folder" as any: {
          const { selectedFiles } = data.state as any
          const fileToOpen = selectedFiles[0]
          preloadFiles({ type: "my-drive", path: fileToOpen.location })
          break
        }
        case CustomActions.DownloadFile.id: {
          const { selectedFiles } = data.state
          for (const file of selectedFiles) {
            if (!FileHelper.isDirectory(file)) {
              const { id, name } = file
              const url = getMediaUrl(
                settings.apiUrl,
                id,
                name,
                session?.hash!,
                true
              )
              navigateToExternalUrl(url, false)
            }
          }
          break
        }
        case CustomActions.OpenInVLCPlayer.id: {
          const { selectedFiles } = data.state
          const fileToOpen = selectedFiles[0]
          const { id, name } = fileToOpen
          const url = `vlc://${getMediaUrl(
            settings.apiUrl,
            id,
            name,
            session?.hash!
          )}`
          navigateToExternalUrl(url, false)
          break
        }
        case CustomActions.RenameFile.id: {
          setModalState({
            open: true,
            file: data.state.selectedFiles[0],
            operation: CustomActions.RenameFile.id,
          })
          break
        }
        case CustomActions.DeleteFile.id: {
          setModalState({
            open: true,
            selectedFiles: data.state.selectedFiles.map((item) => item.id),
            operation: CustomActions.DeleteFile.id,
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
        case CustomActions.CopyDownloadLink.id: {
          const selections = data.state.selectedFilesForAction
          let clipboardText = ""
          selections.forEach((element) => {
            if (!FileHelper.isDirectory(element)) {
              const { id, name } = element
              clipboardText = `${clipboardText}${getMediaUrl(
                settings.apiUrl,
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
            destination: destination.path ? destination.path : "/",
          })
          if (res.status === 200) {
            queryClient.invalidateQueries({
              queryKey: ["files"],
            })
          }
          break
        }
        case ChonkyActions.SortFilesBySize.id:
        case ChonkyActions.SortFilesByDate.id:
        case ChonkyActions.SortFilesByName.id: {
          const order =
            sortFilter[type].sort !== sortMap[data.id]
              ? SortOrder.ASC
              : toggleSort(sortFilter[type].order)

          setSortFilter({
            ...sortFilter,
            ...{
              [type]: {
                sort: sortMap[data.id],
                order,
              },
            },
          })

          break
        }
        case CustomActions.SyncFiles.id: {
          const queryKey = [
            "files",
            type,
            path,
            sortFilter[params.type].sort,
            sortFilter[params.type].order,
          ]
          queryClient.invalidateQueries({ queryKey })
          break
        }
        default:
          break
      }
    }
  }, [sortFilter, type])

  return { fileActions, chonkyActionHandler }
}
