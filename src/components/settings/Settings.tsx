import { memo } from "react"
import { getRouteApi, Outlet } from "@tanstack/react-router"
import { Button } from "@tw-material/react"
import CodiconAccount from "~icons/codicon/account"
import CodiconSettings from "~icons/codicon/settings"
import FluentDarkTheme20Filled from "~icons/fluent/dark-theme-20-filled"
import clsx from "clsx"

import { ForwardLink } from "@/components/ForwardLink"

const Tabs = [
  {
    id: "general",
    icon: CodiconSettings,
  },
  {
    id: "appearance",
    icon: FluentDarkTheme20Filled,
  },
  {
    id: "account",
    icon: CodiconAccount,
  },
]

const fileRoute = getRouteApi("/_authenticated/settings/$tabId")

export const Settings = memo(() => {
  const params = fileRoute.useParams()

  return (
    <div className="bg-surface container size-full rounded-xl flex flex-col max-w-3xl gap-4">
      <h1 className="text-2xl font-semibold pt-2">Settings</h1>
      <nav className="inline-flex rounded-full max-w-min bg-surface-container">
        {Tabs.map((tab) => (
          <Button
            as={ForwardLink}
            key={tab.id}
            variant="text"
            to="/settings/$tabId"
            data-selected={params.tabId == tab.id}
            replace
            params={{ tabId: tab.id }}
            className={clsx(
              "text-inherit min-h-14 min-w-16 xs:min-w-20 !px-6 [&>span>svg]:data-[hover=true]:scale-110",
              "data-[selected=false]:data-[hover=true]:text-on-surface text-on-surface-variant",
              "data-[selected=true]:bg-secondary-container",
              "data-[selected=true]:text-on-secondary-container"
            )}
            startContent={<tab.icon />}
          >
            <span className="capitalize hidden xs:block">{tab.id}</span>
          </Button>
        ))}
      </nav>
      <Outlet />
    </div>
  )
})
