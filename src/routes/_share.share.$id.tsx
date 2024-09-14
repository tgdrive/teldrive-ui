import type { ShareQuery, ShareQueryParams } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { shareQueries } from "@/utils/queryOptions";

export const Route = createFileRoute("/_share/share/$id")({
  beforeLoad: async ({ params, context }) => {
    const res = await context.queryClient.fetchQuery(shareQueries.share(params.id));
    if (!res) {
      throw new Error("invalid share id");
    }
  },

  validateSearch: (search: Record<string, unknown>) => search as ShareQuery,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, params, preload, deps }) => {
    const password = JSON.parse(sessionStorage.getItem("password") || "null");
    const queryParams = {
      id: params.id,
      password: password || "",
      parentId: deps.parentId,
    } as ShareQueryParams;
    if (preload) {
      await queryClient.prefetchInfiniteQuery(shareQueries.list(queryParams));
    } else {
      queryClient.fetchInfiniteQuery(shareQueries.list(queryParams));
    }
  },
  wrapInSuspense: true,
});
