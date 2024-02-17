import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/")({
  component: () => (
    <Navigate from="/" to="/$" params={{ _splat: "my-drive" }} replace />
  ),
})
