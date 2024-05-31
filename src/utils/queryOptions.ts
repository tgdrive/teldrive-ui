import { useCallback, useEffect } from "react"
import {
  BrowseView,
  CategoryStorage,
  FilePayload,
  FileResponse,
  QueryParams,
  Session,
  Settings,
  SingleFile,
  UploadStats,
} from "@/types"
import {
  InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { NavigateOptions, useRouter } from "@tanstack/react-router"
import type { FileData } from "@tw-material/file-browser"
import toast from "react-hot-toast"

import { useProgress } from "@/components/TopProgress"

import { bytesToGB, getExtension, mediaUrl } from "./common"
import { defaultSortState, settings, sortIdsMap, sortViewMap } from "./defaults"
import { getPreviewType, preview } from "./getPreviewType"
import http from "./http"

const mapFilesToFb = (files: SingleFile[], sessionHash: string): FileData[] => {
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

    const previewType = getPreviewType(getExtension(item.name), {
      video: item.mimeType.includes("video"),
    })

    let thumbnailUrl = ""
    if (previewType === "image") {
      if (settings.resizerHost) {
        const url = new URL(mediaUrl(item.id, item.name, sessionHash))
        url.searchParams.set("w", "360")
        thumbnailUrl = settings.resizerHost
          ? `${settings.resizerHost}/${url.host}${url.pathname}${url.search}`
          : ""
      }
    }
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      mimeType: item.mimeType,
      location: item.parentPath,
      size: item.size ? Number(item.size) : 0,
      previewType,
      openable: preview[previewType!] ? true : false,
      starred: item.starred,
      thumbnailUrl,
      modDate: item.updatedAt,
      isEncrypted: item.encrypted,
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

export const filesQueryOptions = (params: QueryParams, sessionHash?: string) =>
  infiniteQueryOptions({
    queryKey: ["files", params],
    queryFn: fetchFiles(params),
    initialPageParam: "",
    getNextPageParam: (lastPage, _) => lastPage.nextPageToken,
    select: (data) =>
      data.pages.flatMap((page) =>
        page.results ? mapFilesToFb(page.results, sessionHash as string) : []
      ),
  })

export const uploadStatsQueryOptions = (days: number) =>
  queryOptions({
    queryKey: ["uploadstats", days],
    queryFn: async ({ signal }) => uploadStats(days, signal),
    select: (data) =>
      data.map((stat) => {
        let options = { day: "numeric", month: "short" } as const
        let formattedDate = new Intl.DateTimeFormat("en-US", options).format(
          new Date(stat.uploadDate)
        )
        return {
          totalUploaded: bytesToGB(stat.totalUploaded),
          uploadDate: formattedDate,
        }
      }),
  })

export const categoryStorageQueryOptions = queryOptions({
  queryKey: ["category-storage"],
  queryFn: async ({ signal }) => categoryStorage(signal),
})

export const usePreload = () => {
  const queryClient = useQueryClient()

  const router = useRouter()

  const { startProgress, stopProgress } = useProgress()

  const preloadFiles = useCallback(
    async (params: QueryParams, showProgress = true) => {
      const queryKey = ["files", params]

      const queryState = queryClient.getQueryState(queryKey)

      const nextRoute: NavigateOptions = {
        to: "/$",
        params: {
          _splat: params.type + params.path,
        },
        search: params.filter,
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
  const preloadStorage = useCallback(async () => {
    const queryKey = ["stats"]
    const queryState = queryClient.getQueryState(queryKey)

    const nextRoute: NavigateOptions = {
      to: "/storage",
    }
    if (!queryState?.data) {
      try {
        startProgress()
        await router.preloadRoute(nextRoute)
        router.navigate(nextRoute)
      } finally {
        stopProgress()
      }
    } else router.navigate(nextRoute)
  }, [])

  return { preloadFiles, preloadStorage }
}

async function fetchSession() {
  const res = await http.get<Session>("/api/auth/session")
  const contentType = res.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return res.data
  } else {
    return null
  }
}

async function uploadStats(days: number, signal: AbortSignal) {
  const res = await http.get<UploadStats[]>("/api/uploads/stats", {
    params: { days },
    signal,
  })
  return res.data
}

async function categoryStorage(signal: AbortSignal) {
  const res = await http.get<CategoryStorage[]>("/api/files/category/stats", {
    signal,
  })
  return res.data
}

export const fetchFiles =
  (params: QueryParams) =>
  async ({ pageParam, signal }: { pageParam: string; signal: AbortSignal }) => {
    const { type, path } = params
    const query: Record<string, string | number | boolean> = {
      nextPageToken: pageParam,
      perPage: 500,
      order:
        type === "my-drive" ? defaultSortState.order : sortViewMap[type].order,
      sort:
        type === "my-drive"
          ? sortIdsMap[defaultSortState.sortId]
          : sortIdsMap[sortViewMap[type].sortId],
    }

    if (type === "my-drive") {
      query.path = path.startsWith("/") ? path : "/" + path
    } else if (type === "search") {
      query.op = "find"
      for (const key in params.filter) query[key] = params.filter[key]
    } else if (type === "starred") {
      query.op = "find"
      query.starred = true
    } else if (type === "recent") {
      query.op = "find"
      query.type = "file"
    } else if (type === "category") {
      query.op = "find"
      query.type = "file"
      query.category = path.replaceAll("/", "")
    }

    return (
      await http.get<FileResponse>("/api/files", { params: query, signal })
    ).data
  }

export const useCreateFile = (queryKey: any[]) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) =>
      http.post("/api/files", data),
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
    onMutate: async (variables: { files: string[] }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousFiles = queryClient.getQueryData(queryKey)
      queryClient.setQueryData<InfiniteData<FileResponse>>(queryKey, (prev) => {
        return <InfiniteData<FileResponse>>{
          ...prev,
          pages: prev?.pages.map((page) => ({
            ...page,
            results: page.results.filter(
              (val) => !variables.files.includes(val.id)
            ),
          })),
        }
      })
      return { previousFiles }
    },
    onError: (_1, _2, context) => {
      queryClient.setQueryData(queryKey, context?.previousFiles)
    },
    onSuccess: () => {
      toast.success("File deleted successfully")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
