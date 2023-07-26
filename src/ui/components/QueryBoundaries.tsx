import * as React from "react"
import { Box, Button, Typography } from "@mui/material"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"

import Loader from "./Loader"

export const QueryBoundaries = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onReset={reset} FallbackComponent={ErrorView}>
        <React.Suspense fallback={<Loader />}>{children}</React.Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
)

const ErrorView = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Box>
      <Typography>{error.message}</Typography>
      <Button title="Retry" onClick={resetErrorBoundary} />
    </Box>
  )
}
