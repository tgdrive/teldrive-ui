import * as React from "react"
import { Navigate } from "react-router-dom"

import { useSession } from "@/ui/hooks/useSession"
import Signin from "@/ui/components/SignIn"

export function Component() {
  const { data: session, status } = useSession()
  if (status === "loading") {
    return null
  }
  if (session && status === "success") {
    return <Navigate to="/my-drive" replace />
  }
  return <Signin />
}
