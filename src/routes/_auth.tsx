import { NonAuthLayout } from "@/layouts/NonAuthLayout"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { sessionQueryOptions } from "@/utils/queryOptions"

export const Route = createFileRoute("/_auth")({
  component: NonAuthLayout,
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQueryOptions)
    if (session) {
      throw redirect({
        to: "/$",
        params: { _splat: "my-drive" },
      })
    }
  },
})
