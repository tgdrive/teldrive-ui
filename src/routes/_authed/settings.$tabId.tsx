import { createFileRoute } from "@tanstack/react-router"

import { SettingsTabView } from "@/components/settings/settings-tab-view"

export const Route = createFileRoute("/_authed/settings/$tabId")({
  component: SettingsTabView,
})
