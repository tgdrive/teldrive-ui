import { useCallback } from "react";
import type {
  AccountStats,
  CategoryStorage,
  Channel,
  FilePayload,
  FileResponse,
  FileShare,
  QueryParams,
  Session,
  ShareQueryParams,
  SingleFile,
  UploadStats,
  UserSession,
} from "@/types";
import {
  type InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useMutation,
} from "@tanstack/react-query";
import type { FileData } from "@tw-material/file-browser";
import toast from "react-hot-toast";

import { bytesToGB, getExtension, mediaUrl } from "./common";
import { defaultSortState, settings, sortIdsMap, sortViewMap } from "./defaults";
import { getPreviewType, preview } from "./preview-type";
import http from "./http";
import { queryClient } from "./query-client";

export const fileQueries = {
  all: () => "files",
  list: (filters: QueryParams, sessionHash?: string) =>
    infiniteQueryOptions({
      queryKey: [fileQueries.all(), filters],
      queryFn: fetchFiles(filters),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _) =>
        lastPage.meta.currentPage + 1 > lastPage.meta.totalPages
          ? undefined
          : lastPage.meta.currentPage + 1,
      select: (data) =>
        data.pages.flatMap((page) =>
          page.files ? mapFilesToFb(page.files, sessionHash as string) : [],
        ),
    }),
  getFile: (id: string, enabled: boolean) =>
    queryOptions({
      queryKey: [fileQueries.all(), id],
      queryFn: async () => (await http.get<SingleFile>(`/api/files/${id}`)).data,
      select: ({ path, ...data }) => ({
        ...data,
        path: path?.split("/").slice(0, -1).join("/"),
      }),
      enabled,
    }),
  create: (queryKey: any[]) => {
    return useMutation({
      mutationFn: async (data: Record<string, any>) => http.post("/api/files", data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },
  update: (queryKey: any[]) => {
    return useMutation({
      mutationFn: async (data: FilePayload) => {
        return (await http.patch(`/api/files/${data.id}`, data.payload)).data;
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousFiles = queryClient.getQueryData<FileResponse>(queryKey);

        if (previousFiles) {
          queryClient.setQueryData<InfiniteData<FileResponse>>(queryKey, (prev) => {
            return <InfiniteData<FileResponse>>{
              ...prev,
              pages: prev?.pages.map((page) => ({
                ...page,
                results: page.files.map((val) =>
                  val.id === variables.id ? { ...val, ...variables.payload } : val,
                ),
              })),
            };
          });
        }
        return { previousFiles };
      },
      onError: (_1, _2, context) => {
        if (context?.previousFiles) {
          queryClient.setQueryData(queryKey, context?.previousFiles);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },
  delete: (queryKey: any[]) => {
    return useMutation({
      mutationFn: async (data: Record<string, any>) => {
        return (await http.post("/api/files/delete", { files: data.files })).data;
      },
      onMutate: async (variables: { files: string[] }) => {
        await queryClient.cancelQueries({ queryKey });
        const previousFiles = queryClient.getQueryData(queryKey);
        queryClient.setQueryData<InfiniteData<FileResponse>>(queryKey, (prev) => {
          return <InfiniteData<FileResponse>>{
            ...prev,
            pages: prev?.pages.map((page) => ({
              ...page,
              results: page.files.filter((val) => !variables.files.includes(val.id)),
            })),
          };
        });
        return { previousFiles };
      },
      onError: (_1, _2, context) => {
        queryClient.setQueryData(queryKey, context?.previousFiles);
      },
      onSuccess: () => {
        toast.success("File deleted successfully");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },
};

export const shareQueries = {
  all: () => "shares",
  shareByFileId: (fileId: string) =>
    queryOptions({
      queryKey: [shareQueries.all(), fileId],
      queryFn: async ({ signal }) =>
        (await http.get<FileShare>(`/api/files/${fileId}/share`, { signal })).data,
      refetchOnWindowFocus: false,
    }),
  share: (shareId: string) =>
    queryOptions({
      queryKey: [shareQueries.all(), shareId],
      queryFn: async ({ signal }) =>
        (await http.get<FileShare>(`/api/share/${shareId}`, { signal })).data,
    }),
  list: (params: ShareQueryParams) =>
    infiniteQueryOptions({
      queryKey: [shareQueries.all(), params],
      queryFn: async ({ signal }) =>
        (
          await http.get<FileResponse>(`/api/share/${params.id}/files`, {
            signal,
            params: params.path ? { path: params.path } : {},
            headers: params.password ? { Authorization: btoa(`:${params.password}`) } : {},
          })
        ).data,
      initialPageParam: 1,
      getNextPageParam: (lastPage, _) =>
        lastPage.meta.currentPage + 1 > lastPage.meta.totalPages
          ? undefined
          : lastPage.meta.currentPage + 1,
      select: (data) =>
        data.pages.flatMap((page) => (page.files ? mapFilesToFb(page.files, "") : [])),
    }),
  create: (fileId: string, queryKey: any[]) => {
    return useMutation({
      mutationFn: async (data: Record<string, any>) =>
        http.post(`/api/files/${fileId}/share`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({
          queryKey: [fileQueries.all(), { path: "", type: "shared" }],
        });
      },
    });
  },
  delete: (fileId: string, queryKey: any[]) => {
    return useMutation({
      mutationFn: async () => http.delete(`/api/files/${fileId}/share`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({
          queryKey: [fileQueries.all(), { path: "", type: "shared" }],
        });
      },
    });
  },
};

const fetchSession = async () => {
  const res = await http.get<Session>("/api/auth/session");
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.data;
  }
  return null;
};

export const userQueries = {
  all: () => "users",
  uploadStats: (days: number) =>
    queryOptions({
      queryKey: [userQueries.all(), "upload-stats", days],
      queryFn: async ({ signal }) =>
        (
          await http.get<UploadStats[]>("/api/uploads/stats", {
            signal,
          })
        ).data,
      select: (data) =>
        data.map((stat) => {
          const options = { day: "numeric", month: "short" } as const;
          const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
            new Date(stat.uploadDate),
          );
          return {
            totalUploaded: bytesToGB(stat.totalUploaded),
            uploadDate: formattedDate,
          };
        }),
    }),
  categories: () =>
    queryOptions({
      queryKey: [userQueries.all(), "categories"],
      queryFn: async ({ signal }) =>
        (
          await http.get<CategoryStorage[]>("/api/files/category/stats", {
            signal,
          })
        ).data,
    }),
  session: () =>
    queryOptions({
      queryKey: [userQueries.all(), "session"],
      queryFn: fetchSession,
      refetchOnWindowFocus: false,
    }),
  sessions: () =>
    queryOptions({
      queryKey: [userQueries.all(), "sessions"],
      queryFn: async ({ signal }) =>
        (await http.get<UserSession[]>("/api/users/sessions", { signal })).data,
    }),
  deleteSession: (queryKey = [userQueries.all(), "sessions"]) => {
    return useMutation({
      mutationFn: async (id: string) => http.delete(`/api/users/sessions/${id}`),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousSessions = queryClient.getQueryData(queryKey);
        queryClient.setQueryData<UserSession[]>(queryKey, (prev) =>
          prev!.filter((val) => val.hash !== variables),
        );
        return { previousSessions };
      },
      onError: (_1, _2, context) => {
        queryClient.setQueryData(queryKey, context?.previousSessions);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },
  stats: (userName: string) =>
    queryOptions({
      queryKey: [userQueries.all(), "stats", userName],
      queryFn: async () => (await http.get<AccountStats>("/api/users/stats")).data,
    }),
  channels: (userName: string) =>
    queryOptions({
      queryKey: [userQueries.all(), "channel", userName],
      queryFn: async () => (await http.get<Channel[]>("/api/users/channels")).data,
    }),
};

const fetchFiles =
  (params: QueryParams) =>
  async ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) => {
    const { view, search } = params;
    const query: Record<string, string | number | boolean> = {
      page: pageParam,
      limit: settings.pageSize || 500,
      order: view === "my-drive" ? defaultSortState.order : sortViewMap[view].order,
      sort:
        view === "my-drive"
          ? sortIdsMap[defaultSortState.sortId]
          : sortIdsMap[sortViewMap[view].sortId],
    };
    if (params.search?.searchType) {
      query.searchType = params.search.searchType;
    }

    if (view === "my-drive") {
      query.path = search?.path ?? "/";
    } else if (view === "search") {
      query.op = "find";
      for (const key in search) {
        if (key !== "path") {
          query[key] = search[key];
        }
      }
    } else if (view === "recent") {
      query.op = "find";
      query.type = "file";
    } else if (view === "browse") {
      if (search?.parentId) {
        query.parentId = search?.parentId;
      }
      if (search?.category) {
        query.op = "find";
        query.type = "file";
        query.category = search?.category;
      }
    } else if (view === "shared") {
      query.op = "find";
      query.shared = true;
    }

    return (await http.get<FileResponse>("/api/files", { params: query, signal })).data;
  };

const mapFilesToFb = (files: SingleFile[], sessionHash: string): FileData[] => {
  return files.map((item): FileData => {
    if (item.mimeType === "drive/folder") {
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        mimeType: item.mimeType,
        size: item.size ? Number(item.size) : 0,
        modDate: item.updatedAt,
        isDir: true,
      };
    }

    const previewType = getPreviewType(getExtension(item.name), {
      video: item.mimeType.includes("video"),
    });

    let thumbnailUrl = "";
    if (previewType === "image") {
      if (settings.resizerHost) {
        const url = mediaUrl(item.id, item.name, "", sessionHash);
        thumbnailUrl = settings.resizerHost
          ? `${settings.resizerHost}/insecure/w:360/plain/${encodeURIComponent(url)}`
          : "";
      }
    }
    return {
      id: item.id,
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
