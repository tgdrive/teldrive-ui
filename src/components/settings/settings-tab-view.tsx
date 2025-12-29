import { memo } from "react";
import { getRouteApi } from "@tanstack/react-router";

import { AccountTab } from "./account-tab";
import { AppearanceTab } from "./appearance-tab";
import { GeneralTab } from "./general-tab";
import { InfoTab } from "./info-tab";

const fileRoute = getRouteApi("/_authed/settings/$tabId");

export const SettingsTabView = memo(() => {
  const params = fileRoute.useParams();

  switch (params.tabId) {
    case "appearance":
      return <AppearanceTab />;
    case "account":
      return <AccountTab />;
    case "general":
      return <GeneralTab />;
    default:
      return <InfoTab />;
  }
});
