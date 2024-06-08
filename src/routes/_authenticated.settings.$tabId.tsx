import { createFileRoute } from "@tanstack/react-router"

import { SettingsTabView } from "@/components/settings/SettingsTabView"

export const Route = createFileRoute("/_authenticated/settings/$tabId")({
  component: SettingsTabView,
})
