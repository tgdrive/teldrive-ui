import { useCallback } from "react"
import { FilePayload, FileResponse, Params, QueryParams } from "@/ui/types"
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { useProgress } from "@/ui/components/TopProgress"
import { getSortOrder } from "@/ui/utils/common"
import http from "@/ui/utils/http"

export const usePreloadFiles = () => {
  const queryClient = useQueryClient()

  const navigate = useNavigate()

  const { startProgress, stopProgress } = useProgress()

  const preloadFiles = useCallback(
    (params: QueryParams) => {
      const order = getSortOrder()
      const queryKey = ["files", params.type, params.path, order]
      const queryState = queryClient.getQueryState(queryKey)
      if (!queryState?.data) {
        startProgress()
        queryClient
          .prefetchInfiniteQuery(
            queryKey,
            fetchData(params.type, params.path, order)
          )
          .then(() => {
            navigate(`/${params.type}${params.path}`)
            stopProgress()
          })
          .catch(() => stopProgress())
      } else navigate(`/${params.type}${params.path}`)
    },
    [queryClient]
  )

  return { preloadFiles }
}

export const useFetchFiles = (params: QueryParams) => {
  const order = getSortOrder()
  const queryKey = ["files", params.type, params.path, order]

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isInitialLoading,
  } = useInfiniteQuery(queryKey, fetchData(params.type, params.path, order), {
    getNextPageParam: (lastPage, allPages) =>
      lastPage.nextPageToken ? lastPage?.nextPageToken : undefined,
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
  (type: string, path: string, order: string) =>
  async ({ pageParam = "" }): Promise<FileResponse> => {
    const url = "/api/files"

    const params: Partial<Params> = {
      nextPageToken: pageParam,
      perPage: 200,
      order,
    }

    if (type === "my-drive") {
      params.path = path ? path : "/"
      params.sort = "name"
    }

    if (type === "search") {
      params.op = "search"
      params.sort = "updatedAt"
      params.search = path.split("/")?.[1] ?? ""
    }

    if (type === "search" && !params.search) return { results: [] }

    if (type === "starred") {
      params.op = "find"
      params.sort = "updatedAt"
      params.starred = true
      params.order = "desc"
    }

    if (type === "recent") {
      params.op = "find"
      params.sort = "updatedAt"
      params.order = "desc"
      params.type = "file"
    }

    let res = await http.get(url, { params })

    return res.data
  }

export const useCreateFile = (params: QueryParams) => {
  const order = getSortOrder()
  const queryKey = ["files", params.type, params.path, order]
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

export const useUpdateFile = (params: QueryParams) => {
  const order = getSortOrder()
  const queryKey = ["files", params.type, params.path, order]
  const queryClient = useQueryClient()
  const mutation = useMutation({
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

export const useDeleteFile = (params: QueryParams) => {
  const order = getSortOrder()
  const queryKey = ["files", params.type, params.path, order]
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return (await http.post(`/api/files/deletefiles`, { files: data.files }))
        .data
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
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousFiles)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
  return { mutation }
}
