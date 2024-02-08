import { useCallback } from "react"
import {
  BrowseView,
  FilePayload,
  FileResponse,
  QueryParams,
  Session,
  SingleFile,
} from "@/types"
import type { FileData } from "@bhunter179/chonky"
import {
  InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { NavigateOptions, useRouter } from "@tanstack/react-router"

import { defaultSortState } from "@/hooks/useSortFilter"
import { useProgress } from "@/components/TopProgress"

import { getExtension } from "./common"
import { getPreviewType } from "./getPreviewType"
import http from "./http"

const mapFilesToChonky = (files: SingleFile[]): FileData[] => {
  return files.map((item): FileData => {
    if (item.mimeType === "drive/folder")
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        mimeType: item.mimeType,
        location: item.parentPath,
        size: item.size ? Number(item.size) : 0,
        modDate: item.updatedAt,
        path: item.path,
        isDir: true,
      }

    return {
      id: item.id,
      name: item.name,
      type: item.type,
      mimeType: item.mimeType,
      location: item.parentPath,
      size: item.size ? Number(item.size) : 0,
      previewType: getPreviewType(getExtension(item.name), {
        video: item.mimeType.includes("video"),
      }),
      starred: item.starred,
      modDate: item.updatedAt,
    }
  })
}
export const sessionQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: fetchSession,
  staleTime: 10 * (60 * 1000),
  gcTime: 15 * (60 * 1000),
  refetchOnWindowFocus: false,
})

export const filesQueryOptions = (params: QueryParams) =>
  infiniteQueryOptions({
    queryKey: ["files", params],
    queryFn: fetchFiles(params),
    initialPageParam: "",
    getNextPageParam: (lastPage, _) => lastPage.nextPageToken,
    select: (data) =>
      data.pages.flatMap((page) =>
        page.results ? mapFilesToChonky(page.results) : []
      ),
  })

export const usePreloadFiles = () => {
  const queryClient = useQueryClient()

  const router = useRouter()

  const { startProgress, stopProgress } = useProgress()

  const preloadFiles = useCallback(
    async (path: string, type?: BrowseView, showProgress = true) => {
      const newParams = {
        path,
        type: type,
      }
      const queryKey = ["files", newParams]
      const queryState = queryClient.getQueryState(queryKey)

      const nextRoute: NavigateOptions = {
        to: "/$",
        params: {
          _splat: newParams.type + path,
        },
      }
      if (!queryState?.data) {
        try {
          if (showProgress) startProgress()
          await router.preloadRoute(nextRoute)
          router.navigate(nextRoute)
        } finally {
          if (showProgress) stopProgress()
        }
      } else router.navigate(nextRoute)
    },
    [queryClient]
  )

  return preloadFiles
}

async function fetchSession() {
  const res = await http.get<Session>("/api/auth/session")
  const contentType = res.headers["content-type"]
  if (contentType && contentType.includes("application/json")) {
    return res.data
  } else {
    return null
  }
}

export const fetchFiles =
  (params: QueryParams) =>
  async ({ pageParam, signal }: { pageParam: string; signal: AbortSignal }) => {
    const { type, path } = params
    const query: Record<string, string | number | boolean> = {
      nextPageToken: pageParam,
      perPage: 500,
      order: defaultSortState[params.type].order,
      sort: defaultSortState[params.type].sort,
    }

    if (type === "my-drive") {
      query.path = path.startsWith("/") ? path : "/" + path
    } else if (type === "search") {
      query.op = "search"
      query.search = path.split("/")?.[1] ?? ""

      if (!query.search) return { results: [] }
    } else if (type === "starred") {
      query.op = "find"
      query.starred = true
    } else if (type === "recent") {
      query.op = "find"
      query.type = "file"
    }

    return (
      await http.get<FileResponse>("/api/files", { params: query, signal })
    ).data
  }

export const useCreateFile = (queryKey: any[]) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: FilePayload) =>
      http.post("/api/files", data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export const useUpdateFile = (queryKey: any[]) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: FilePayload) => {
      return (await http.patch(`/api/files/${data.id}`, data.payload)).data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousFiles = queryClient.getQueryData<FileResponse>(queryKey)

      if (previousFiles) {
        queryClient.setQueryData<InfiniteData<FileResponse>>(
          queryKey,
          (prev) => {
            return <InfiniteData<FileResponse>>{
              ...prev,
              pages: prev?.pages.map((page) => ({
                ...page,
                results: page.results.map((val) =>
                  val.id === variables.id
                    ? { ...val, ...variables.payload }
                    : val
                ),
              })),
            }
          }
        )
      }
      return { previousFiles }
    },
    onError: (_1, _2, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(queryKey, context?.previousFiles)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export const useDeleteFile = (queryKey: any[]) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return (await http.post(`/api/files/delete`, { files: data.files })).data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousFiles = queryClient.getQueryData(queryKey)
      queryClient.setQueryData<InfiniteData<FileResponse>>(queryKey, (prev) => {
        return <InfiniteData<FileResponse>>{
          ...prev,
          pages: prev?.pages.map((page) => ({
            ...page,
            results: page.results.filter((val) => val.id !== variables.id),
          })),
        }
      })
      return { previousFiles }
    },
    onError: (_1, _2, context) => {
      queryClient.setQueryData(queryKey, context?.previousFiles)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
