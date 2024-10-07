import { createLazyFileRoute } from "@tanstack/react-router"

import { DriveFileBrowser } from "@/components/file-browser"

export const Route = createLazyFileRoute("/_authed/$")({
  component: DriveFileBrowser,
})
