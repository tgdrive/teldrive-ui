import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"

import { ThemeProvider } from "@/components/ThemeProvider"
import { queryClient } from "@/utils/queryClient"

import { routeTree } from "./routeTree.gen"

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreloadDelay: 300,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("root")!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
