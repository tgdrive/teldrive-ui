import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { FileVisibility, Session } from "@/ui/types"
import { useQuery } from "@tanstack/react-query"

import http from "@/ui/utils/http"

import { TELDRIVE_OPTIONS } from "../const"

export async function fetchSession() {
  const res = await http.get<Session>("/api/auth/session")
  const contentType = res.headers["content-type"]
  if (contentType && contentType.includes("application/json")) {
    return res.data
  } else {
    return null
  }
}
function checkFileVisibility(fileId = "unknown") {
  return async () => {
    const res = await http.get<FileVisibility>(
      `/api/files/checkFileVisibility/${fileId}`
    )
    return res.data
  }
}

type SessionOptions = {
  onUnauthenticated?: () => void
}

export function useSession({
  onUnauthenticated = () => void 0,
}: SessionOptions = {}) {
  const [isEnabled, setIsEnabled] = useState(false)
  const { data, status, refetch } = useQuery(["session"], fetchSession, {
    staleTime: 3600,
    refetchOnWindowFocus: false,
  })

  const {
    query: { path },
  } = useRouter()

  const { data: fileVisibility } = useQuery(
    ["fileVisibility"],
    checkFileVisibility(path?.[1]),
    {
      enabled: isEnabled,
    }
  )

  useEffect(() => {
    if (path?.[1] && path?.[0] === TELDRIVE_OPTIONS.shared.id) {
      setIsEnabled(true)
    }
  }, [path])

  useEffect(() => {
    if (path && fileVisibility !== "public" && fileVisibility != undefined) {
      if (!data && status == "success") onUnauthenticated()
    }
  }, [data, path, fileVisibility])

  return { data, status, refetch, fileVisibility }
}
