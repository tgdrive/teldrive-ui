import { memo, useCallback } from "react"
import { getRouteApi } from "@tanstack/react-router"

import { AccountTab } from "./AccountTab"
import { ApperanceTab } from "./ApperanceTab"
import { GeneralTab } from "./GeneralTab"

const fileRoute = getRouteApi("/_authenticated/settings/$tabId")

export const SettingsTabView = memo(() => {
  const params = fileRoute.useParams()
  const renderTab = useCallback(() => {
    switch (params.tabId) {
      case "appearance":
        return <ApperanceTab />

      case "account":
        return <AccountTab />
      default:
        return <GeneralTab />
    }
  }, [params.tabId])

  return <>{renderTab()}</>
})
