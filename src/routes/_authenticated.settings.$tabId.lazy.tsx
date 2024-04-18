import { createLazyFileRoute } from "@tanstack/react-router"

import { SettingsTabView } from "@/components/settings/SettingsTabView"

export const Route = createLazyFileRoute("/_authenticated/settings/$tabId")({
  component: SettingsTabView,
})
