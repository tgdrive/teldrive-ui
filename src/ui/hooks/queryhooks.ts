import { useCallback } from "react"
import { useRouter } from "next/router"
import {
  DriveCategory,
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

import { TELDRIVE_OPTIONS } from "../const"
import { useSession } from "./useSession"

export const usePreloadFiles = () => {
  const queryClient = useQueryClient()

  const router = useRouter()

  const { startProgress, stopProgress } = useProgress()
  const { data: sessionData } = useSession()

  const preloadFiles = useCallback(
    (path: string) => {
      const splitPath = path.split("/")
      const order = getSortOrder()
      const queryKey = ["files", splitPath, getSortOrder()]
      const queryState = queryClient.getQueryState(queryKey)
      if (!queryState?.data) {
        startProgress()
        queryClient
          .prefetchInfiniteQuery(
            queryKey,
            fetchData(splitPath, order, sessionData?.userName || "")
          )
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

  const { data: sessionData } = useSession()

  const sortOrder = getSortOrder()
  const queryKey = [key, path, sortOrder]
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isInitialLoading,
  } = useInfiniteQuery(
    queryKey,
    fetchData(path as string[], sortOrder, sessionData?.userName || ""),
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.nextPageToken ? lastPage?.nextPageToken : undefined,
      enabled,
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
  (path: string[], order: string, username: string) =>
  async ({ pageParam = "" }): Promise<FileResponse> => {
    const type = path[0] as DriveCategory

    let url = "/api/files"

    const params: Partial<Params> = {
      nextPageToken: pageParam,
      perPage: 200,
      order,
    }

    params.accessFromPublic = !Boolean(username)

    if (type === TELDRIVE_OPTIONS.myDrive.id) {
      params.path = realPath(path)
      params.sort = "name"
      params.view = "my-drive"
    }

    if (type === TELDRIVE_OPTIONS.search.id) {
      params.op = "search"
      params.sort = "updatedAt"
      params.search = path?.[1] ?? ""
      params.view = "search"
    }

    if (type === TELDRIVE_OPTIONS.search.id && !params.search)
      return { results: [] }

    if (type === TELDRIVE_OPTIONS.starred.id) {
      params.op = "find"
      params.sort = "updatedAt"
      params.starred = true
      params.order = "desc"
      params.view = "starred"
    }
    if (type === TELDRIVE_OPTIONS.shared.id) {
      params.op = "shared"
      params.fileId = path[1]
      params.path = realPath(path)
      params.sort = "updatedAt"
      params.view = "shared"
      params.sharedWithUsername = username
    }

    if (type === TELDRIVE_OPTIONS.recent.id) {
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
