import { QueryClient } from "@tanstack/react-query"
import {
  createFileRoute,
  ParsedLocation,
  redirect,
} from "@tanstack/react-router"

import { AuthLayout } from "@/layouts/AuthLayout"
import { sessionQueryOptions } from "@/utils/queryOptions"

const checkAuth = async (
  queryClient: QueryClient,
  location: ParsedLocation,
  preload: boolean
) => {
  if (preload) {
    return
  }
  const session = await queryClient.ensureQueryData(sessionQueryOptions)
  if (!session) {
    redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
      throw: true,
    })
  }
}

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
  beforeLoad: ({ location, context: { queryClient }, preload }) =>
    checkAuth(queryClient, location, preload),
})
