import * as React from "react"
import { ErrorOutline } from "@mui/icons-material"
import { Box, Button, Container, Typography } from "@mui/material"
import { useNavigate } from "@tanstack/react-router"
import { AxiosError } from "axios"

const ErrorView = ({ error }: { error: Error }) => {
  const axiosError = error as AxiosError<{ error: string }>
  const navigate = useNavigate()
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
            navigate({
              to: "/$",
              params: { _splat: "my-drive" },
              replace: true,
            })
          }}
        >
          Go to main directory
        </Button>
      </Box>
    </Container>
  )
}

export default ErrorView
