import type { operations } from "@/lib/api";
import type { Dispatch, SetStateAction } from "react";

export type BrowseView = "my-drive" | "search" | "recent" | "browse";

export type FileListParams = {
  view: BrowseView;
  params: Exclude<operations["Files_list"]["parameters"]["query"], undefined>;
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

export type SetValue<T> = Dispatch<SetStateAction<T>>;

export type PreviewFile = {
  id: string;
  name: string;
  mimeType: string;
  previewType: string;
};
