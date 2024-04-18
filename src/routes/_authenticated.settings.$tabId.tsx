import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/settings/$tabId")({
  component: () => <div>Hello /_authenticated/settings!</div>,
})
