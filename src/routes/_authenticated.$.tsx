import { createFileRoute } from "@tanstack/react-router"

import { extractPathParts } from "@/utils/common"
import { filesQueryOptions } from "@/utils/queryOptions"

const allowedTypes = [
  "my-drive",
  "starred",
  "recent",
  "search",
  "storage",
  "category",
]

export const Route = createFileRoute("/_authenticated/$")({
  beforeLoad: ({ params }) => {
    const { type, path } = extractPathParts(params._splat)
    if (!allowedTypes.includes(type)) {
      throw new Error("invalid path")
    }
    return { queryParams: { type, path } }
  },
  loader: async ({ context: { queryClient, queryParams }, preload }) => {
    if (preload)
      await queryClient.prefetchInfiniteQuery(filesQueryOptions(queryParams))
    else queryClient.fetchInfiniteQuery(filesQueryOptions(queryParams))
  },
  wrapInSuspense: true,
})
