import { createLazyFileRoute } from "@tanstack/react-router"

import { Login } from "@/components/Login"

export const Route = createLazyFileRoute("/_auth/login")({
  component: Login,
})
