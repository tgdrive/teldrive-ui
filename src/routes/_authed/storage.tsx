import { createFileRoute } from "@tanstack/react-router";

import { userQueries } from "@/utils/queryOptions";
import { StorageView } from "@/components/StorageView";

export const Route = createFileRoute("/_authed/storage")({
  component: StorageView,
  wrapInSuspense: true,
  loader: async ({ context: { queryClient }, preload }) => {
    if (preload) {
      await Promise.all([
        queryClient.ensureQueryData(userQueries.uploadStats(7)),
        queryClient.ensureQueryData(userQueries.categories()),
      ]);
    } else {
      queryClient.ensureQueryData(userQueries.uploadStats(7));
      queryClient.ensureQueryData(userQueries.categories());
    }
  },
});
