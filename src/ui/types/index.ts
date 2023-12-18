import { Dispatch, SetStateAction } from "react"
import { FileData, SortOrder } from "@bhunter179/chonky"

export type FileResponse = { results: File[]; nextPageToken?: string }

export type File = {
  name: string
  type: string
  mimeType: string
  path?: string
  size: number
  depth: number
  createdAt: string
  updatedAt: string
  userId: string
  parentId: string
  id: string
  starred: boolean
}

export type ModalState = {
  open: boolean
  operation: string
  type: string
  file: FileData
  selectedFiles: string[]
  name: string
  successful: boolean
}

export type Params = {
  nextPageToken: string
  perPage: number
  order: string
  path: string
  search: string
  sort: string
  starred: boolean
  type: string
  op: string
  view: string
}

export type FilePayload = {
  id?: string
  payload?: Record<string, any>
}

export type UploadPart = {
  name: string
  partId: number
  partNo: number
  size: number
  channelId: number
  encrypted?: boolean
  salt?: string
}

export type AuthMessage = {
  type: string
  payload: Record<string, string | number | boolean>
  message: string
}

export type Message = {
  message: string
  error?: string
  code?: number
}

export type Settings = {
  apiUrl: string
  splitFileSize: number
  uploadConcurrency: number
  encryptFiles: string
  channel?: Channel
  bots?: string
}

export type Session = {
  name: string
  userName: string
  isPremium: boolean
  hash: string
  expires: string
}

export type QueryParams = {
  type: string
  path: string
}

export type AccountStats = {
  totalSize: number
  totalFiles: number
  channelId: number
  channelName: string
  [key: string]: number | string
}

export type Channel = {
  channelName: string
  channelId: number
}

export type Tags = {
  [key: string]: any
}

export type AudioMetadata = {
  artist: string
  title: string
  cover: string
}

export type SortField = "name" | "size" | "updatedAt"

export type SortState = {
  [key: string]: { sort: SortField; order: SortOrder }
}

export type SetValue<T> = Dispatch<SetStateAction<T>>

export type PreviewFile = {
  id: string
  name: string
  mimeType: string
  previewType: string
  starred: boolean
}
