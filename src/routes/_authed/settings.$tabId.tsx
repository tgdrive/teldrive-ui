import { createFileRoute } from "@tanstack/react-router";

import { SettingsTabView } from "@/components/settings/settings-tab-view";
import { $api } from "@/utils/api";
import { Spinner } from "@tw-material/react";

export const Route = createFileRoute("/_authed/settings/$tabId")({
  component: SettingsTabView,
  wrapInSuspense: true,
  pendingComponent: () => (
    <div className="flex justify-center items-center size-full">
      <Spinner />
    </div>
  ),
  loader: async ({ context: { queryClient }, params }) => {
    if (params.tabId === "account") {
      await Promise.all([
        queryClient.ensureQueryData($api.queryOptions("get", "/users/sessions")),
        queryClient.ensureQueryData($api.queryOptions("get", "/users/config")),
        queryClient.ensureQueryData($api.queryOptions("get", "/users/channels")),
      ]);
    }
  },
});
