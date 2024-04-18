import { createLazyFileRoute } from "@tanstack/react-router"

import { StorageView } from "@/components/StorageView"

export const Route = createLazyFileRoute("/_authenticated/storage")({
  component: StorageView,
})
