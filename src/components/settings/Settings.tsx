import { memo } from "react"
import { Outlet, useParams } from "@tanstack/react-router"
import { Button } from "@tw-material/react"
import CodiconAccount from "~icons/codicon/account"
import CodiconSettings from "~icons/codicon/settings"
import FluentDarkTheme20Filled from "~icons/fluent/dark-theme-20-filled"
import LucideUserRound from "~icons/lucide/user-round"
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
  // {
  //   id: "profile",
  //   icon: LucideUserRound,
  // },
]

export const Settings = memo(() => {
  const params = useParams({ from: "/_authenticated/settings/$tabId" })

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
            replace
            params={{ tabId: tab.id }}
            className={clsx(
              "text-inherit min-h-14 min-w-16 xs:min-w-20 !px-6 [&>span>svg]:data-[hover=true]:scale-110",
              "data-[hover=true]:text-on-surface text-on-surface-variant",
              params.tabId === tab.id &&
                "bg-secondary-container text-on-secondary-container"
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
