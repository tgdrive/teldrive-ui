import { createLazyFileRoute } from "@tanstack/react-router"

import SignIn from "@/components/LoginForm"

export const Route = createLazyFileRoute("/_auth/login")({
  component: SignIn,
})
