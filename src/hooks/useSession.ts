import { useQuery } from "@tanstack/react-query"

import { sessionQueryOptions } from "@/utils/queryOptions"

export function useSession() {
  const { data, status, isLoading, refetch } = useQuery(sessionQueryOptions)

  return { data, status, isLoading, refetch }
}
