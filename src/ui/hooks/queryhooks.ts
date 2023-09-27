import { useCallback } from "react"
import {
  FilePayload,
  FileResponse,
  Params,
  QueryParams,
  SortState,
} from "@/ui/types"
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { useProgress } from "@/ui/components/TopProgress"
import http from "@/ui/utils/http"

import { useSortFilter } from "./useSortFilter"

export const usePreloadFiles = () => {
  const queryClient = useQueryClient()

  const navigate = useNavigate()

  const { startProgress, stopProgress } = useProgress()

  const { sortFilter } = useSortFilter()

  const preloadFiles = useCallback(
    (params: QueryParams) => {
      const queryKey = [
        "files",
        params.type,
        params.path,
        sortFilter[params.type].sort,
        sortFilter[params.type].order,
      ]
      const queryState = queryClient.getQueryState(queryKey)
      if (!queryState?.data) {
        startProgress()
        queryClient
          .prefetchInfiniteQuery(
            queryKey,
            fetchData(params.type, params.path, sortFilter)
          )
          .then(() => {
            navigate(`/${params.type}${params.path}`)
            stopProgress()
          })
          .catch(() => stopProgress())
      } else navigate(`/${params.type}${params.path}`)
    },
    [queryClient, sortFilter]
  )

  return { preloadFiles }
}

export const useFetchFiles = (params: QueryParams) => {
  const { sortFilter } = useSortFilter()

  const queryKey = [
    "files",
    params.type,
    params.path,
    sortFilter[params.type].sort,
    sortFilter[params.type].order,
  ]

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isInitialLoading,
  } = useInfiniteQuery(
    queryKey,
    fetchData(params.type, params.path, sortFilter),
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.nextPageToken ? lastPage?.nextPageToken : undefined,
      refetchOnWindowFocus: false,
    }
  )

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
  (type: string, path: string, sortFilter: SortState) =>
  async ({ pageParam = "" }): Promise<FileResponse> => {
    const url = "/api/files"

    const params: Partial<Params> = {
      nextPageToken: pageParam,
      perPage: 200,
      order: sortFilter[type].order,
      sort: sortFilter[type].sort,
    }

    if (type === "my-drive") {
      params.path = path ? path : "/"
    }

    if (type === "search") {
      params.op = "search"
      params.search = path.split("/")?.[1] ?? ""
    }

    if (type === "search" && !params.search) return { results: [] }

    if (type === "starred") {
      params.op = "find"
      params.starred = true
    }

    if (type === "recent") {
      params.op = "find"
      params.type = "file"
    }

    let res = await http.get(url, { params })

    return res.data
  }

export const useCreateFile = (params: QueryParams) => {
  const { sortFilter } = useSortFilter()

  const queryKey = [
    "files",
    params.type,
    params.path,
    sortFilter[params.type].sort,
    sortFilter[params.type].order,
  ]
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
  const { sortFilter } = useSortFilter()

  const queryKey = [
    "files",
    params.type,
    params.path,
    sortFilter[params.type].sort,
    sortFilter[params.type].order,
  ]
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
            return {
              ...prev,
              pages: prev?.pages.map((page) => ({
                ...page,
                results: page.results.map((val) =>
                  val.id === variables.id
                    ? { ...val, ...variables.payload }
                    : val
                ),
              })),
            } as InfiniteData<FileResponse>
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
  const { sortFilter } = useSortFilter()

  const queryKey = [
    "files",
    params.type,
    params.path,
    sortFilter[params.type].sort,
    sortFilter[params.type].order,
  ]
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
        return {
          ...prev,
          pages: prev?.pages.map((page) => ({
            ...page,
            results: page.results.filter((val) => val.id !== variables.id),
          })),
        } as InfiniteData<FileResponse>
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
