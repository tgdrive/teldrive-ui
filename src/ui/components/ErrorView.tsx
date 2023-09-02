import * as React from "react"
import { useRouter } from "next/router"
import { ErrorOutline } from "@mui/icons-material"
import { Box, Button, Container, Typography } from "@mui/material"
import { AxiosError } from "axios"

import { TELDRIVE_OPTIONS } from "../const"

const ErrorView = ({ error }: { error: Error }) => {
  const axiosError = error as AxiosError<{ error: string }>
  const router = useRouter()
  return (
    <Container maxWidth="md" style={{ textAlign: "center", marginTop: "20vh" }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap="10px">
        <ErrorOutline sx={{ fontSize: 100, color: "red" }} />
        <Typography variant="h4" gutterBottom>
          {axiosError.response?.data.error || error.message}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          title="Go to main directory"
          onClick={() => {
            router.replace(`/${TELDRIVE_OPTIONS.myDrive.id}`)
          }}
        >
          Go to main directory
        </Button>
      </Box>
    </Container>
  )
}

export default ErrorView
