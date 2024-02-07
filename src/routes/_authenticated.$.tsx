import { createFileRoute } from "@tanstack/react-router"

import { extractPathParts } from "@/utils/common"
import { filesQueryOptions } from "@/utils/queryOptions"

const allowedTypes = ["my-drive", "starred", "recent", "search"]

export const Route = createFileRoute("/_authenticated/$")({
  beforeLoad: async ({ params }) => {
    const { type, path } = extractPathParts(params._splat)
    if (!allowedTypes.includes(type)) {
      throw new Error("invalid path")
    }
    return { queryParams: { type, path } }
  },
  loader: async ({ context: { queryClient, queryParams }, preload }) => {
    if (preload) {
      await queryClient.prefetchInfiniteQuery(filesQueryOptions(queryParams))
      return
    }
    queryClient.fetchInfiniteQuery(filesQueryOptions(queryParams))
  },
})
