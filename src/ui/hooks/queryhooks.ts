import { useCallback } from "react"
import { useRouter } from "next/router"
import {
  FilePayload,
  FileResponse,
  PaginatedQueryData,
  Params,
  QueryParams,
} from "@/ui/types"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { useProgress } from "@/ui/components/TopProgress"
import { getSortOrder, realPath } from "@/ui/utils/common"
import http from "@/ui/utils/http"

export const usePreloadFiles = () => {
  const queryClient = useQueryClient()

  const router = useRouter()

  const { startProgress, stopProgress } = useProgress()

  const preloadFiles = useCallback(
    (path: string) => {
      const splitPath = path.split("/")
      const order = getSortOrder()
      const queryKey = ["files", splitPath, getSortOrder()]
      const queryState = queryClient.getQueryState(queryKey)
      if (!queryState?.data) {
        startProgress()
        queryClient
          .prefetchInfiniteQuery(queryKey, fetchData(splitPath, order))
          .then(() => {
            stopProgress()
            router.push(path, undefined, { scroll: false })
          })
          .catch(() => stopProgress())
      } else router.push(path, undefined, { scroll: false })
    },
    [queryClient, router]
  )

  return { preloadFiles }
}

export const useFetchFiles = (queryParams: Partial<QueryParams>) => {
  const { key, path, enabled } = queryParams
  const sortOrder = getSortOrder()
  const queryKey = [key, path, sortOrder]
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isInitialLoading,
  } = useInfiniteQuery(queryKey, fetchData(path as string[], sortOrder), {
    getNextPageParam: (lastPage, allPages) =>
      lastPage.nextPageToken ? lastPage?.nextPageToken : undefined,
    enabled,
    refetchOnWindowFocus: false,
  })

  return {
    data,
    error,
    isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}

export const fetchData =
  (path: string[], order: string) =>
  async ({ pageParam = "" }): Promise<FileResponse> => {
    const type = path[0]

    let url = "/api/files"

    const params: Partial<Params> = {
      nextPageToken: pageParam,
      perPage: 200,
      order,
    }

    if (type === "my-drive") {
      params.path = realPath(path)
      params.sort = "name"
      params.view = "my-drive"
    }

    if (type === "search") {
      params.op = "search"
      params.sort = "updatedAt"
      params.search = path?.[1] ?? ""
      params.view = "search"
    }

    if (type === "search" && !params.search) return { results: [] }

    if (type === "starred") {
      params.op = "find"
      params.sort = "updatedAt"
      params.starred = true
      params.order = "desc"
      params.view = "starred"
    }

    if (type === "recent") {
      params.op = "find"
      params.sort = "updatedAt"
      params.order = "desc"
      params.type = "file"
      params.view = "recent"
    }

    let res = await http.get(url, { params })

    return res.data
  }

export const useCreateFile = (queryParams: Partial<QueryParams>) => {
  const { key, path } = queryParams
  const sortOrder = getSortOrder()
  const queryKey = [key, path, sortOrder]
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: FilePayload) => {
      return (await http.post(`/api/files`, data.payload)).data
    },
    onSuccess: (data, variables, context) => {
      if (data.id) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
  return { mutation }
}

export const useShareFile = (queryParams: Partial<QueryParams>) => {
  const { key, path } = queryParams
  const sortOrder = getSortOrder()
  const queryKey = [key, path, sortOrder]
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: FilePayload) => {
      return (await http.post(`/api/files/sharefile/${data.id}`, data.payload))
        .data
    },
    onSettled: (data, variables, context) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
  return { mutation }
}

export const useUpdateFile = (queryParams: Partial<QueryParams>) => {
  const { key, path } = queryParams
  const sortOrder = getSortOrder()
  const queryKey = [key, path, sortOrder]
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: FilePayload) => {
      return (await http.patch(`/api/files/${data.id}`, data.payload)).data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousFiles = queryClient.getQueryData<FileResponse>(queryKey)

      if (previousFiles) {
        queryClient.setQueryData<PaginatedQueryData<FileResponse>>(
          queryKey,
          (prev) => {
            return <PaginatedQueryData<FileResponse>>{
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
    onError: (err, variables, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(queryKey, context?.previousFiles)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
  return { mutation }
}

export const useDeleteFile = (queryParams: Partial<QueryParams>) => {
  const { key, path } = queryParams
  const sortOrder = getSortOrder()
  const queryKey = [key, path, sortOrder]
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return (await http.post(`/api/files/deletefiles`, { files: data.files }))
        .data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })
      const previousFiles = queryClient.getQueryData(queryKey)
      queryClient.setQueryData<PaginatedQueryData<FileResponse>>(
        queryKey,
        (prev) => {
          return <PaginatedQueryData<FileResponse>>{
            ...prev,
            pages: prev?.pages.map((page) => ({
              ...page,
              results: page.results.filter((val) => val.id !== variables.id),
            })),
          }
        }
      )
      return { previousFiles }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousFiles)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
  return { mutation }
}
