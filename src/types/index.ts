import type { Dispatch, SetStateAction } from "react";

export type FileResponse = {
  files: SingleFile[];
  meta: { totalPages: number; count: number; currentPage: number };
};

export type SingleFile = {
  name: string;
  type: string;
  mimeType: string;
  size: number;
  depth: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  parentId: string;
  id: string;
  encrypted?: boolean;
};

export type FilePayload = {
  id?: string;
  payload?: Record<string, any>;
};

export type UploadPart = {
  name: string;
  partId: number;
  partNo: number;
  size: number;
  channelId: number;
  encrypted?: boolean;
  salt?: string;
};

export type AuthMessage = {
  type: string;
  payload: Record<string, string | number | boolean>;
  message: string;
};

export type Message = {
  message: string;
  error?: string;
  code?: number;
};

export type Settings = {
  pageSize: number;
  resizerHost: string;
  splitFileSize: number;
  uploadConcurrency: number;
  encryptFiles: string;
};

export type Session = {
  name: string;
  userName: string;
  userId: number;
  isPremium: boolean;
  hash: string;
  expires: string;
};

export type UserSession = {
  hash: string;
  createdAt: string;
  location?: string;
  officialApp?: boolean;
  appName?: string;
  valid: boolean;
  current: boolean;
};

export type QueryParams = {
  type: BrowseView;
  path: string;
  filter?: FilterQuery;
};

export type ShareQueryParams = {
  id: string;
  path?: string;
  password?: string;
};

export type AccountStats = {
  channelId: number;
  bots: string[];
};

export type Channel = {
  channelName?: string;
  channelId: number;
};

export type Tags = {
  [key: string]: any;
};

export type AudioMetadata = {
  artist: string;
  title: string;
  cover: string;
};

export type UploadStats = {
  uploadDate: string;
  totalUploaded: number;
};

export type CategoryStorage = {
  category: string;
  totalFiles: number;
  totalSize: number;
};

export type FileShare = {
  id: string;
  expirationDate: string;
  protected: boolean;
  type: string;
  name: string;
};

export type SetValue<T> = Dispatch<SetStateAction<T>>;

export type PreviewFile = {
  id: string;
  name: string;
  mimeType: string;
  previewType: string;
};
export type BrowseView = "my-drive" | "search" | "recent" | "category" | "browse" | "shared";

export type FilterQuery = {
  category?: string;
  path?: string;
  query?: string;
  updatedAt?: string;
  deepSearch?: boolean;
  parentId?: string;
};

export type ShareQuery = {
  path?: string;
};
