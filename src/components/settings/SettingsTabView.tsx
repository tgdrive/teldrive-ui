import { memo } from "react";
import { getRouteApi } from "@tanstack/react-router";

import { AccountTab } from "./AccountTab";
import { ApperanceTab } from "./ApperanceTab";
import { GeneralTab } from "./GeneralTab";
import { InfoTab } from "./InfoTab";

const fileRoute = getRouteApi("/_authenticated/settings/$tabId");

export const SettingsTabView = memo(() => {
  const params = fileRoute.useParams();

  switch (params.tabId) {
    case "appearance":
      return <ApperanceTab />;
    case "account":
      return <AccountTab />;
    case "general":
      return <GeneralTab />;
    default:
      return <InfoTab />;
  }
});
