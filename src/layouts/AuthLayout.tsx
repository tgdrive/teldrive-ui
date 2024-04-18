import { memo } from "react"
import { Outlet } from "@tanstack/react-router"
import clsx from "clsx"

import Header from "@/components/Header"
import { SideNav } from "@/components/navs/SideNav"
import { scrollbarClasses } from "@/utils/classes"

export const AuthLayout = memo(() => {
  return (
    <div className="flex flex-col-reverse md:flex-row h-dvh overflow-hidden">
      <SideNav />
      <div className="relative flex flex-1 flex-col overflow-x-hidden">
        <Header auth />
        <main
          className={clsx(
            "max-w-screen-2xl flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2",
            scrollbarClasses
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
})
