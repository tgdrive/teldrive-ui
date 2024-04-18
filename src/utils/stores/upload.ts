import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export enum FileUploadStatus {
  NOT_STARTED,
  UPLOADING,
  UPLOADED,
  CANCELLED,
  FAILED,
}

export interface UploadFile {
  id: string
  file: File
  status: FileUploadStatus
  totalChunks: number
  controller: AbortController
  progress: number
}

export interface UploadState {
  filesIds: string[]
  fileMap: Record<string, UploadFile>
  currentFileId: string
  collapse: boolean
  fileDialogOpen: boolean
  uploadOpen: boolean
  actions: {
    addFiles: (files: File[]) => void
    setCurrentFileId: (id: string) => void
    toggleCollapse: () => void
    setFileUploadStatus: (id: string, status: FileUploadStatus) => void
    removeFile: (id: string) => void
    cancelUpload: () => void
    setFileDialogOpen: (open: boolean) => void
    setUploadOpen: (open: boolean) => void
    setProgress: (id: string, progress: number) => void
    startNextUpload: () => void
  }
}

export const useFileUploadStore = create<UploadState>()(
  immer((set) => ({
    filesIds: [],
    fileMap: {},
    currentFileId: "",
    collapse: false,
    fileDialogOpen: false,
    uploadOpen: false,
    actions: {
      addFiles: (files: File[]) =>
        set((state) => {
          const newFiles = files.map((file) => ({
            id: Math.random().toString(36).slice(2, 9),
            file,
            status: FileUploadStatus.NOT_STARTED,
            totalChunks: 0,
            controller: new AbortController(),
            progress: 0,
          }))

          const ids = newFiles.map((file) => {
            state.fileMap[file.id] = file
            return file.id
          })
          state.filesIds.push(...ids)
          if (!state.currentFileId) state.currentFileId = ids[0]
        }),

      setProgress: (id: string, progress: number) =>
        set((state) => {
          state.fileMap[id].progress = progress
        }),
      setFileUploadStatus: (id: string, status: FileUploadStatus) =>
        set((state) => {
          state.fileMap[id].status = status
        }),

      setCurrentFileId: (id: string) =>
        set((state) => {
          state.currentFileId = id
        }),

      removeFile: (id: string) =>
        set((state) => {
          const file = state.fileMap[id]
          if (file?.controller) file.controller.abort()
          delete state.fileMap[id]
          state.filesIds = state.filesIds.filter((fileId) => fileId !== id)
          if (state.filesIds.length === 0) {
            state.currentFileId = ""
            state.collapse = false
            state.uploadOpen = false
            state.fileMap = {}
          }
        }),

      cancelUpload: () =>
        set((state) => {
          const file = state.fileMap[state.currentFileId]
          if (file?.controller) file.controller.abort()
          state.fileMap = {}
          state.filesIds = []
          state.currentFileId = ""
          state.collapse = false
          state.uploadOpen = false
        }),
      toggleCollapse: () =>
        set((state) => {
          state.collapse = !state.collapse
        }),
      setFileDialogOpen: (open: boolean) =>
        set((state) => {
          state.fileDialogOpen = open
        }),
      setUploadOpen: (open: boolean) =>
        set((state) => {
          state.uploadOpen = open
        }),
      startNextUpload: () =>
        set((state) => {
          const nextFileId = state.filesIds.findIndex(
            (id) => id === state.currentFileId
          )
          if (nextFileId === -1 || nextFileId == state.filesIds.length - 1)
            return
          state.currentFileId = state.filesIds[nextFileId + 1]
        }),
    },
  }))
)
