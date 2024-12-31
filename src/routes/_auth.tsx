import { createFileRoute, redirect } from "@tanstack/react-router";

import { NonAuthLayout } from "@/layouts/non-auth-layout";
import { $api } from "@/utils/api";

export const Route = createFileRoute("/_auth")({
  component: NonAuthLayout,
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(
      $api.queryOptions(
        "get",
        "/auth/session",
        {},
        {
          initialData: null as any,
        },
      ),
    );
    if (session) {
      redirect({
        to: "/$view",
        params: { view: "my-drive" },
        search: {
          path: "/",
        },
        throw: true,
      });
    }
  },
});
