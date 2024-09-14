import { createFileRoute } from "@tanstack/react-router";

import { userQueries } from "@/utils/queryOptions";

export const Route = createFileRoute("/_authenticated/storage")({
  wrapInSuspense: true,
  loader: async ({ context: { queryClient }, preload }) => {
    if (preload) {
      await Promise.all([
        queryClient.prefetchQuery(userQueries.uploadStats(7)),
        queryClient.prefetchQuery(userQueries.categories()),
      ]);
    } else {
      queryClient.prefetchQuery(userQueries.uploadStats(7));
      queryClient.prefetchQuery(userQueries.categories());
    }
  },
});
