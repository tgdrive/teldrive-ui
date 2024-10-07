import { createFileRoute } from "@tanstack/react-router"

import { SettingsTabView } from "@/components/settings/SettingsTabView"

export const Route = createFileRoute("/_authed/settings/$tabId")({
  component: SettingsTabView,
})
