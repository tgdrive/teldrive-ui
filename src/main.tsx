import "./globals.css"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { Toaster } from "react-hot-toast"

import { queryClient } from "@/utils/queryClient"

import { TailwindIndicator } from "./components/TailwindIndicator"
import { ThemeProvider } from "./components/ThemeProvider"
import { ProgressProvider } from "./components/TopProgress"
import { routeTree } from "./routeTree.gen"

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
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
      <ProgressProvider>
        <ThemeProvider>
          <Toaster
            toastOptions={{
              className: "!bg-surface-container !text-on-surface",
            }}
            position="bottom-right"
          />
          <RouterProvider router={router} />
        </ThemeProvider>
        <TailwindIndicator />
      </ProgressProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
