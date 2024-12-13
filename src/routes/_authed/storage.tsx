import { createFileRoute } from "@tanstack/react-router";

import { userQueries } from "@/utils/query-options";

export const Route = createFileRoute("/_authed/storage")({
  wrapInSuspense: true,
  loader: async ({ context: { queryClient } }) => {
    await Promise.allSettled([
      queryClient.ensureQueryData(userQueries.uploadStats(7)),
      queryClient.ensureQueryData(userQueries.categories()),
    ]);
  },
});
