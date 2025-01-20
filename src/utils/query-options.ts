import type { FileListParams } from "@/types";
import { infiniteQueryOptions, queryOptions, useQuery } from "@tanstack/react-query";
import type { FileData } from "@tw-material/file-browser";

import { getExtension, mediaUrl } from "./common";
import { defaultSortState, sortIdsMap, sortViewMap } from "./defaults";
import { getPreviewType, preview } from "./preview-type";
import { fetchClient } from "./api";
import type { components } from "@/lib/api";
import { getSettings } from "./stores/settings";

export const sessionOptions = queryOptions({
  queryKey: ["session"],
  queryFn: async ({ signal }) => {
    const res = await fetchClient.GET("/auth/session", {
      signal,
    });
    if (res.response.status === 204) {
      return null;
    }
    return res.data;
  },
});

export const useSession = () => {
  const { data, isLoading, refetch } = useQuery(sessionOptions);
  const status = isLoading ? "loading" : data?.user ? "success" : "unauthenticated";
  return [data?.user ?? null, status, refetch] as const;
};

export const fileQueries = {
  list: (params: FileListParams) =>
    infiniteQueryOptions({
      queryKey: ["Files_list", params.view, params.params],
      queryFn: fetchFiles(params),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _) =>
        lastPage?.meta.currentPage! + 1 > lastPage?.meta.totalPages!
          ? undefined
          : lastPage?.meta.currentPage! + 1,
      select: (data) =>
        data.pages.flatMap((page) => (page?.items ? mapFilesToFb(page?.items!) : [])),
    }),
};

const fetchFiles =
  (qparams: FileListParams) =>
  async ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) => {
    const { view, params } = qparams;
    const query: FileListParams["params"] = {
      page: pageParam,
      order: view === "my-drive" ? defaultSortState.order : sortViewMap[view].order,
      sort:
        view === "my-drive"
          ? sortIdsMap[defaultSortState.sortId]
          : sortIdsMap[sortViewMap[view].sortId],
    };
    if (view === "my-drive") {
      query.path = params?.path ?? "/";
    } else if (view === "search") {
      query.operation = "find";
      query.searchType = params?.searchType;
      for (const key in params) {
        if (key !== "path") {
          query[key] = params[key];
        }
      }
    } else if (view === "recent") {
      query.operation = "find";
      query.type = "file";
    } else if (view === "browse") {
      query.parentId = params?.parentId;
      if (params?.category) {
        query.operation = "find";
        query.type = "file";
        query.category = params?.category;
      }
    }

    return (
      await fetchClient.GET("/files", {
        params: {
          query,
        },
        signal,
      })
    ).data;
  };

const mapFilesToFb = (files: components["schemas"]["FileList"]["items"]) => {
  const settings = getSettings();
  return files.map((item): FileData => {
    if (item.mimeType === "drive/folder") {
      return {
        id: item.id!,
        name: item.name,
        type: item.type,
        mimeType: item.mimeType,
        size: item.size ? Number(item.size) : 0,
        modDate: item.updatedAt,
        isDir: true,
      };
    }

    const previewType = getPreviewType(getExtension(item.name), {
      video: item.mimeType?.includes("video"),
    });

    let thumbnailUrl = "";
    if (previewType === "image") {
      if (settings.resizerHost) {
        const url = mediaUrl(item.id!, item.name, "");
        thumbnailUrl = settings.resizerHost
          ? `${settings.resizerHost}/insecure/w:360/plain/${encodeURIComponent(url)}`
          : "";
      }
    }
    return {
      id: item.id!,
      name: item.name,
      type: item.type,
      mimeType: item.mimeType,
      size: item.size ? Number(item.size) : 0,
      previewType,
      openable: !!preview[previewType!],
      thumbnailUrl,
      modDate: item.updatedAt,
      isEncrypted: item.encrypted,
    };
  });
};
