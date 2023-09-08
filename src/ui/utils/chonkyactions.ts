// @ts-nocheck
import { Dispatch, SetStateAction } from "react"
import { Message, ModalState, QueryParams, Settings } from "@/ui/types"
import {
  ChonkyActions,
  ChonkyActionUnion,
  ChonkyIconName,
  CustomVisibilityState,
  defineFileAction,
  FileHelper,
  MapFileActionsToData,
} from "@bhunter179/chonky"
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons/faArrowsRotate"
import { QueryClient } from "@tanstack/react-query"

import { getExtension, getMediaUrl, realPath } from "@/ui/utils/common"
import { getPreviewType, preview } from "@/ui/utils/getPreviewType"

import { getSortOrder, navigateToExternalUrl } from "./common"
import http from "./http"

export const DownloadFile = defineFileAction({
  id: "download_file" as const,
  requiresSelection: true,
  fileFilter: (file) => (file && "isDir" in file ? false : true),
  button: {
    name: "Download",
    contextMenu: true,
    icon: ChonkyIconName.download,
  },
})

export const RenameFile = defineFileAction({
  id: "rename_file" as const,
  requiresSelection: true,
  button: {
    name: "Rename",
    contextMenu: true,
    icon: ChonkyIconName.rename,
  },
})

export const DeleteFile = defineFileAction({
  id: "delete_file" as const,
  requiresSelection: true,
  button: {
    name: "Delete",
    contextMenu: true,
    icon: ChonkyIconName.trash,
  },
})

export const SyncFiles = defineFileAction({
  id: "sync_files" as const,
  button: {
    name: "Sync Files",
    toolbar: true,
    iconOnly: true,
    icon: faArrowsRotate,
  },
})

export const OpenInVLCPlayer = defineFileAction({
  id: "open_vlc_player" as const,
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
})

export const CopyDownloadLink = defineFileAction({
  id: "copy_link" as const,
  requiresSelection: true,
  fileFilter: (file) => (file && "isDir" in file ? false : true),
  button: {
    name: "Copy Download Link",
    contextMenu: true,
    icon: ChonkyIconName.copy,
  },
})

export const CreateFolder = (group = "", path = "") =>
  defineFileAction({
    id: "create_folder" as const,
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
  })

export const UploadFiles = (group = "", path = "") =>
  defineFileAction({
    id: "upload_files" as const,
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
  })

export const handleAction = (
  params: QueryParams,
  settings: Settings,
  setModalState: Dispatch<SetStateAction<Partial<ModalState>>>,
  queryClient: QueryClient,
  path: string | string[] | undefined,
  openUpload: () => void,
  openFileDialog: () => void,
  preloadFiles: (params: QueryParams) => void
) => {
  return async (data: MapFileActionsToData<ChonkyActionUnion>) => {
    switch (data.id) {
      case ChonkyActions.OpenFiles.id: {
        const { targetFile, files } = data.payload
        const fileToOpen = targetFile ?? files[0]

        if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
          preloadFiles({ ...params, path: fileToOpen.path })
        } else {
          const previewType = getPreviewType(getExtension(fileToOpen.name))
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
      case DownloadFile.id: {
        const { selectedFiles } = data.state
        for (const file of selectedFiles) {
          if (!FileHelper.isDirectory(file)) {
            const { id, name } = file
            const url = getMediaUrl(settings.apiUrl, id, name, true)
            navigateToExternalUrl(url, false)
          }
        }
        break
      }
      case OpenInVLCPlayer.id: {
        const { selectedFiles } = data.state
        const fileToOpen = selectedFiles[0]
        const { id, name } = fileToOpen
        const url = `vlc://${getMediaUrl(settings.apiUrl, id, name)}`
        navigateToExternalUrl(url, false)
        break
      }
      case RenameFile.id: {
        setModalState({
          open: true,
          file: data.state.selectedFiles[0],
          operation: RenameFile.id,
        })
        break
      }
      case DeleteFile.id: {
        setModalState({
          open: true,
          selectedFiles: data.state.selectedFiles.map((item) => item.id),
          operation: DeleteFile.id,
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
      case CopyDownloadLink.id: {
        const selections = data.state.selectedFilesForAction
        let clipboardText = ""
        selections.forEach((element) => {
          if (!FileHelper.isDirectory(element)) {
            const { id, name } = element
            clipboardText = `${clipboardText}${getMediaUrl(
              settings.apiUrl,
              id,
              name
            )}\n`
          }
        })
        navigator.clipboard.writeText(clipboardText)
        break
      }
      case ChonkyActions.MoveFiles.id: {
        const { files, destination } = data.payload
        let res = (
          await http.post<Message>("/api/files/movefiles", {
            files: files.map((file) => file.id),
            destination: destination.path ? destination.path : "/",
          })
        ).data
        if (res.status) {
          queryClient.invalidateQueries("files", { active: true })
        }
        break
      }
      case ChonkyActions.SortFilesByName.id: {
        // queryClient.invalidateQueries('files');
        break
      }
      case SyncFiles.id: {
        const queryKey = ["files", params.type, params.path, getSortOrder()]
        queryClient.invalidateQueries(queryKey)
        break
      }
      default:
        break
    }
  }
}
