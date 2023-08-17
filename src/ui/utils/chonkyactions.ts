import { Dispatch, SetStateAction } from "react"
import { NextRouter } from "next/router"
import { Message, ModalState } from "@/ui/types"
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
  id: "download_file",
  requiresSelection: true,
  fileFilter: (file) => (file && "isDir" in file ? false : true),
  button: {
    name: "Download",
    contextMenu: true,
    icon: ChonkyIconName.download,
  },
})

export const RenameFile = defineFileAction({
  id: "rename_file",
  requiresSelection: true,
  button: {
    name: "Rename",
    contextMenu: true,
    icon: ChonkyIconName.rename,
  },
})

export const DeleteFile = defineFileAction({
  id: "delete_file",
  requiresSelection: true,
  button: {
    name: "Delete",
    contextMenu: true,
    icon: ChonkyIconName.trash,
  },
})

export const SyncFiles = defineFileAction({
  id: "sync_files",
  button: {
    name: "Sync Files",
    toolbar: true,
    iconOnly: true,
    icon: faArrowsRotate,
  },
})

export const OpenInVLCPlayer = defineFileAction({
  id: "open_vlc_player",
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
})

export const CopyDownloadLink = defineFileAction({
  id: "copy_link",
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
  })

export const UploadFiles = (group = "", path = "") =>
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
  })

export const handleAction = (
  router: NextRouter,
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

      if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
        //prefetch Query Here
        preloadFiles(fileToOpen.path)
      } else {
        let previewType = getPreviewType(getExtension(fileToOpen.name))
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
          let url = getMediaUrl(id, name, true)
          navigateToExternalUrl(url, false)
        }
      }
    } else if (data.id == OpenInVLCPlayer.id) {
      let { selectedFiles } = data.state
      let fileToOpen = selectedFiles[0]
      let { id, name } = fileToOpen
      let url = `vlc://${getMediaUrl(id, name)}`
      navigateToExternalUrl(url, false)
    } else if (data.id == RenameFile.id)
      setModalState({
        open: true,
        file: data.state.selectedFiles[0],
        operation: RenameFile.id,
      })
    else if (data.id == DeleteFile.id)
      setModalState({
        open: true,
        selectedFiles: data.state.selectedFiles.map((item) => item.id),
        operation: DeleteFile.id,
      })
    else if (data.id == ChonkyActions.CreateFolder.id)
      setModalState({
        open: true,
        operation: ChonkyActions.CreateFolder.id,
      })
    else if (data.id == ChonkyActions.UploadFiles.id) {
      openUpload()
      openFileDialog()
    } else if (data.id == CopyDownloadLink.id) {
      let selections = data.state.selectedFilesForAction
      let clipboardText = ""
      selections.forEach((element) => {
        if (!FileHelper.isDirectory(element)) {
          const { id, name } = element
          clipboardText = `${clipboardText}${getMediaUrl(id, name, true)}\n`
        }
      })
      navigator.clipboard.writeText(clipboardText)
    } else if (data.id == ChonkyActions.MoveFiles.id) {
      const { files, destination } = data.payload
      const destQueryKey = destination.path.split("/")
      const srcQueryKey = router.asPath.split("/").slice(1)
      const dest = realPath(destQueryKey)
      let res = await http
        .post("/api/files/movefiles", {
          json: {
            files: files.map((file) => file.id),
            destination: dest,
          },
        })
        .json<Message>()
      if (res.status) {
        queryClient.invalidateQueries("files")
      }
    } else if (data.id == ChonkyActions.SortFilesByName.id) {
      //queryClient.invalidateQueries('files')
    } else if (data.id == SyncFiles.id) {
      const queryKey = ["files", path, getSortOrder()]
      queryClient.invalidateQueries(queryKey)
    }
  }
}
