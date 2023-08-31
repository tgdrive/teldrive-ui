import { Dispatch, SetStateAction } from "react"
import { NextRouter } from "next/router"
import { Message, ModalState, Settings } from "@/ui/types"
import {
  ChonkyActions,
  ChonkyActionUnion,
  ChonkyIconName,
  CustomVisibilityState,
  defineFileAction,
  FileHelper,
  MapFileActionsToData,
} from "@bhunter179/chonky"
import { FileAction } from "@bhunter179/chonky/dist/types/action.types"
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons/faArrowsRotate"
import { QueryClient } from "@tanstack/react-query"

import { getExtension, getMediaUrl, realPath } from "@/ui/utils/common"
import { getPreviewType, preview } from "@/ui/utils/getPreviewType"

import { getSortOrder, navigateToExternalUrl } from "./common"
import http from "./http"

export const ShareFile = defineFileAction({
  id: "share_file" as const,
  requiresSelection: true,
  button: {
    name: "Share",
    contextMenu: true,
    icon: ChonkyIconName.share,
  },
}) as FileAction

export const DownloadFile = defineFileAction({
  id: "download_file" as const,
  requiresSelection: true,
  fileFilter: (file) => (file && "isDir" in file ? false : true),
  button: {
    name: "Download",
    contextMenu: true,
    icon: ChonkyIconName.download,
  },
}) as FileAction

export const RenameFile = defineFileAction({
  id: "rename_file" as const,
  requiresSelection: true,
  button: {
    name: "Rename",
    contextMenu: true,
    icon: ChonkyIconName.rename,
  },
}) as FileAction

export const DeleteFile = defineFileAction({
  id: "delete_file" as const,
  requiresSelection: true,
  button: {
    name: "Delete",
    contextMenu: true,
    icon: ChonkyIconName.trash,
  },
}) as FileAction

export const SyncFiles = defineFileAction({
  id: "sync_files" as const,
  button: {
    name: "Sync Files",
    toolbar: true,
    iconOnly: true,
    icon: faArrowsRotate,
  },
}) as FileAction

export const OpenInVLCPlayer = defineFileAction({
  id: "open_vlc_player" as const,
  requiresSelection: true,
  fileFilter: (file) =>
    file &&
    getPreviewType(getExtension(file.name)) == "video" &&
    !("isDir" in file)
      ? true
      : false,
  button: {
    name: "Open In VLC",
    contextMenu: true,
    icon: ChonkyIconName.play,
  },
}) as FileAction

export const CopyDownloadLink = defineFileAction({
  id: "copy_link" as const,
  requiresSelection: true,
  fileFilter: (file) => (file && "isDir" in file ? false : true),
  button: {
    name: "Copy Download Link",
    contextMenu: true,
    icon: ChonkyIconName.copy,
  },
}) as FileAction

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
  }) as FileAction

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
  }) as FileAction

export const handleAction = (
  router: NextRouter,
  settings: Settings,
  setModalState: Dispatch<SetStateAction<Partial<ModalState>>>,
  queryClient: QueryClient,
  path: string | string[] | undefined,
  openUpload: () => void,
  openFileDialog: () => void,
  preloadFiles: (path: string) => void
) => {
  return async (data: MapFileActionsToData<ChonkyActionUnion>) => {
    if (data.id == ChonkyActions.OpenFiles.id) {
      let { targetFile, files } = data.payload
      let fileToOpen = targetFile ?? files[0]

      if (fileToOpen.isDir) {
        //prefetch Query Here
        preloadFiles(fileToOpen.path)
      } else {
        let previewType = getPreviewType(getExtension(fileToOpen.name)) || ""
        if (!FileHelper.isDirectory(fileToOpen) && previewType in preview) {
          setModalState({
            open: true,
            file: fileToOpen,
            operation: ChonkyActions.OpenFiles.id,
          })
        }
      }
    } else if (data.id == DownloadFile.id) {
      let { selectedFiles } = data.state
      for (let file of selectedFiles) {
        if (!FileHelper.isDirectory(file)) {
          let { id, name } = file
          let url = getMediaUrl(id, name, settings.apiUrl, true)
          navigateToExternalUrl(url, false)
        }
      }
    } else if (data.id == OpenInVLCPlayer.id) {
      let { selectedFiles } = data.state
      let fileToOpen = selectedFiles[0]
      let { id, name } = fileToOpen
      let url = `vlc://${getMediaUrl(id, name, settings.apiUrl)}`
      navigateToExternalUrl(url, false)
    } else if (data.id == RenameFile.id) {
      setModalState({
        open: true,
        file: data.state.selectedFiles[0],
        operation: RenameFile.id,
      })
    } else if (data.id == DeleteFile.id) {
      setModalState({
        open: true,
        selectedFiles: data.state.selectedFiles.map((item) => item.id),
        operation: DeleteFile.id,
      })
    } else if (data.id == ShareFile.id) {
      setModalState({
        open: true,
        file: data.state.selectedFiles[0],
        operation: ShareFile.id,
      })
    } else if (data.id == ChonkyActions.CreateFolder.id) {
      setModalState({
        open: true,
        operation: ChonkyActions.CreateFolder.id,
      })
    } else if (data.id == ChonkyActions.UploadFiles.id) {
      openUpload()
      openFileDialog()
    } else if (data.id == CopyDownloadLink.id) {
      let selections = data.state.selectedFilesForAction
      let clipboardText = ""
      selections.forEach((element) => {
        if (!FileHelper.isDirectory(element)) {
          const { id, name } = element
          clipboardText = `${clipboardText}${getMediaUrl(
            id,
            name,
            settings.apiUrl
          )}\n`
        }
      })
      navigator.clipboard.writeText(clipboardText)
    } else if (data.id == ChonkyActions.MoveFiles.id) {
      const { files, destination } = data.payload
      const destQueryKey = destination.path.split("/")
      const srcQueryKey = router.asPath.split("/").slice(1)
      const dest = realPath(destQueryKey)
      let res = (
        await http.post<Message>("/api/files/movefiles", {
          files: files.map((file) => file.id),
          destination: dest,
        })
      ).data
      if (res.status) {
        queryClient.invalidateQueries(["files"])
      }
    } else if (data.id == ChonkyActions.SortFilesByName.id) {
      //queryClient.invalidateQueries('files')
    } else if (data.id == SyncFiles.id) {
      const queryKey = ["files", path, getSortOrder()]
      queryClient.invalidateQueries(queryKey)
    }
  }
}
