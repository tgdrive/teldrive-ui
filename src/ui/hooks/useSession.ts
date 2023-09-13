import { useEffect } from "react"
import { Session } from "@/ui/types"
import { useQuery } from "@tanstack/react-query"

import http from "@/ui/utils/http"

export async function fetchSession() {
  const res = await http.get<Session>("/api/auth/session")
  const contentType = res.headers["content-type"]
  if (contentType && contentType.includes("application/json")) {
    return res.data
  } else {
    return null
  }
}

type SessionOptions = {
  onUnauthenticated?: () => void
}

export function useSession({
  onUnauthenticated = () => void 0,
}: SessionOptions = {}) {
  const { data, status, refetch } = useQuery(["session"], fetchSession, {
    staleTime: 3600,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!data && status == "success") onUnauthenticated()
  }, [data])

  return { data, status, refetch }
}
