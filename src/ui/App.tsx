import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/ui/styles/global.css"

import RootLayout from "@/ui/layouts/RootLayout"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { AxiosError } from "axios"
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
} from "react-router-dom"

import { useSession } from "@/ui/hooks/useSession"
import DriveThemeProvider from "@/ui/components/DriveThemeProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * (60 * 1000),
      gcTime: 5 * (60 * 1000),
      retry(_, error) {
        if ((error as AxiosError).response?.status === 404) {
          return false
        }
        return true
      },
    },
  },
})
const router = createBrowserRouter([
  {
    path: "*",
    element: <RootLayout />,
    children: [
      {
        path: "login",
        lazy: () => import("@/ui/routes/login"),
      },
      {
        path: ":type/*",
        async lazy() {
          const { FileBrowser } = await import("@/ui/routes/path")
          return {
            Component: () => (
              <RequireAuth>
                <FileBrowser />
              </RequireAuth>
            ),
          }
        },
      },
    ],
  },
])

function RequireAuth({ children }: { children: JSX.Element }) {
  const { data, status, isLoading } = useSession()

  const location = useLocation()

  if (isLoading || status === "error") {
    return null
  }

  if (!data && status === "success") {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DriveThemeProvider>
        <RouterProvider router={router} />
      </DriveThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
