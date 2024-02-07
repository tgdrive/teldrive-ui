import { Box, Container } from "@mui/material"
import { Outlet } from "@tanstack/react-router"

import Header from "@/components/Header"

export const NonAuthLayout = () => {
  return (
    <Box sx={{ position: "fixed", inset: 0, display: "flex" }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header auth={false} />
        <Container
          maxWidth="xl"
          sx={{
            pt: 1,
            marginTop: 8,
            height: "calc(100% - 68px)",
            "@media (max-width: 1024px)": {
              height: "calc(100% - 124px)",
            },
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
