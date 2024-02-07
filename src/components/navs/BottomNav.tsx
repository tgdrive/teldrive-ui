import BottomNavigation from "@mui/material/BottomNavigation"
import BottomNavigationAction from "@mui/material/BottomNavigationAction"
import Paper from "@mui/material/Paper"
import { useRouterState } from "@tanstack/react-router"

import { ForwardLink } from "../ForwardLink"
import { categories } from "./SideNav"

export default function FixedBottomNavigation() {
  const { location } = useRouterState()

  const currentTab = location.pathname.split("/")[1]

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer,
        display: "none",
        "@media (max-width: 1024px)": {
          display: "block",
        },
      }}
      elevation={3}
    >
      <BottomNavigation showLabels value={currentTab}>
        {categories.map(({ id, name, icon }) => (
          <BottomNavigationAction
            key={id}
            value={id}
            label={name}
            icon={icon}
            component={ForwardLink}
            to="/$"
            params={{ _splat: id }}
            preload="intent"
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
