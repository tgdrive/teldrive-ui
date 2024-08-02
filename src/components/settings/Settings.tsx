import { memo } from "react";
import { getRouteApi, Outlet } from "@tanstack/react-router";
import { Button } from "@tw-material/react";
import CodiconAccount from "~icons/codicon/account";
import CodiconSettings from "~icons/codicon/settings";
import FluentDarkTheme20Filled from "~icons/fluent/dark-theme-20-filled";
import IcOutlineInfo from "~icons/ic/outline-info";
import clsx from "clsx";

import { ForwardLink } from "@/components/ForwardLink";
import { motion } from "framer-motion";

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
  {
    id: "info",
    icon: IcOutlineInfo,
  },
];

const fileRoute = getRouteApi("/_authenticated/settings/$tabId");

export const Settings = memo(() => {
  const params = fileRoute.useParams();

  return (
    <div className="bg-surface container size-full rounded-xl flex flex-col max-w-3xl gap-4">
      <h1 className="text-2xl font-semibold pt-2">Settings</h1>
      <nav className="flex gap-1 rounded-full max-w-min bg-surface-container">
        {Tabs.map((tab) => (
          <div key={tab.id} className="relative">
            <Button
              as={ForwardLink}
              variant="text"
              to="/settings/$tabId"
              disableRipple
              data-selected={params.tabId === tab.id}
              replace
              params={{ tabId: tab.id }}
              className={clsx(
                "text-inherit min-h-14 min-w-16 xs:min-w-20 !px-6 z-1",
                "data-[hover=true]:text-on-surface text-on-surface-variant",
                "data-[selected=true]:text-on-surface data-[hover=true]:bg-transparent",
                "[&>span>svg]:data-[hover=true]:scale-110 ",
                "[&>span>svg]:data-[selected=true]:scale-110",
              )}
              startContent={<tab.icon />}
            >
              <span className="capitalize hidden xs:block">{tab.id}</span>
            </Button>
            {params.tabId === tab.id && (
              <motion.span
                className="absolute rounded-full inset-0 z-0 bg-secondary-container text-on-secondary-container"
                layoutId="pill"
                transition={{
                  type: "spring",
                  bounce: 0.15,
                  duration: 0.5,
                }}
              />
            )}
          </div>
        ))}
      </nav>
      <Outlet />
    </div>
  );
});
