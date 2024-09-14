import { createFileRoute, redirect } from "@tanstack/react-router";

import { NonAuthLayout } from "@/layouts/NonAuthLayout";
import { userQueries } from "@/utils/queryOptions";

export const Route = createFileRoute("/_auth")({
  component: NonAuthLayout,
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(userQueries.session());
    if (session) {
      redirect({
        to: "/$",
        params: { _splat: "my-drive" },
        throw: true,
      });
    }
  },
});
