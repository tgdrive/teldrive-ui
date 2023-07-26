import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

export async function fetchSession() {
  const res = await fetch("/api/auth/session")
  const session = await res.json()
  return session
}

type SessionOptions = {
  onUnauthenticated?: () => void
}

export function useSession({
  onUnauthenticated = () => void 0,
}: SessionOptions = {}) {
  const { data, status,refetch } = useQuery(["session"], fetchSession, {
    staleTime: 3600,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!data && status == "success") onUnauthenticated()
  }, [data])

  return { data, status,refetch }
}
