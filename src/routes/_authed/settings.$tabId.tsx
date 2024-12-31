import { createFileRoute } from "@tanstack/react-router";

import { SettingsTabView } from "@/components/settings/settings-tab-view";
import { $api } from "@/utils/api";

export const Route = createFileRoute("/_authed/settings/$tabId")({
  component: SettingsTabView,
  wrapInSuspense: true,
  loader: async ({ context: { queryClient }, params }) => {
    if (params.tabId === "account") {
      await Promise.allSettled([
        queryClient.ensureQueryData($api.queryOptions("get", "/users/sessions")),
        queryClient.ensureQueryData($api.queryOptions("get", "/users/config")),
      ]);
    }
  },
});
