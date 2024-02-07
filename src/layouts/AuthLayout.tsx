import { Box, Container } from "@mui/material"
import { Outlet } from "@tanstack/react-router"

import Header from "@/components/Header"
import FixedBottomNavigation from "@/components/navs/BottomNav"
import { SideNav } from "@/components/navs/SideNav"

const drawerWidth = 250

export const AuthLayout = () => {
  return (
    <Box sx={{ position: "fixed", inset: 0, display: "flex" }}>
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          display: "block",
          "@media (max-width: 1024px)": {
            display: "none",
          },
        }}
      >
        <SideNav
          PaperProps={{
            sx: {
              width: drawerWidth,
              bgcolor: "background.default",
              boxSizing: "border-box",
            },
          }}
        />
      </Box>
      <FixedBottomNavigation />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header auth={true} />
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
