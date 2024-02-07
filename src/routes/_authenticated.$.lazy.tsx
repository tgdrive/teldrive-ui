import { createLazyFileRoute } from "@tanstack/react-router"
import { AxiosError } from "axios"

import ErrorView from "@/components/ErrorView"
import { DriveFileBrowser } from "@/components/FileBrowser"

export const Route = createLazyFileRoute("/_authenticated/$")({
  component: DriveFileBrowser,
  errorComponent: ({ error }) => {
    if (error instanceof AxiosError) {
      const err =
        error.response?.status === 404
          ? new Error("invalid path")
          : new Error("server error")
      return <ErrorView error={err} />
    }
    return <ErrorView error={error as Error} />
  },
})
