import * as React from "react"
import { Box, Button, Typography } from "@mui/material"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"

import Loader from "./Loader"
import { useRouter } from "next/router"
import { AxiosError } from "axios"

export const QueryBoundaries = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const router = useRouter();
  return <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary key={router.asPath} onReset={reset} FallbackComponent={ErrorView}>
        <React.Suspense fallback={<Loader />}>{children}</React.Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
}

const ErrorView = ({ error, resetErrorBoundary }: FallbackProps) => {
  const axiosError = error as AxiosError<{error: string}>
  const router = useRouter();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap="10px" >
      <Typography>{axiosError.response?.data.error || error.message}</Typography>
      <Button title="Retry" onClick={resetErrorBoundary}>Retry</Button>
      <Button title="Or go to main directory" onClick={()=> {
        router.push("my-drive");
      }}>Or go to main directory</Button>
    </Box>
  )
}
