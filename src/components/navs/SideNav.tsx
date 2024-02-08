import { FC } from "react"
import version from "@/version.json"
import AddToDriveIcon from "@mui/icons-material/AddToDrive"
import StarBorder from "@mui/icons-material/StarBorder"
import WatchLaterIcon from "@mui/icons-material/WatchLater"
import {
  Drawer,
  DrawerProps,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material"
import { Link } from "@tanstack/react-router"

export const categories = [
  { id: "my-drive", name: "My Drive", icon: <AddToDriveIcon /> },
  { id: "starred", name: "Starred", icon: <StarBorder /> },
  { id: "recent", name: "recent", icon: <WatchLaterIcon /> },
] as const

export const SideNav: FC<DrawerProps> = (props) => {
  const { ...others } = props

  return (
    <Drawer variant="permanent" {...others}>
      <Toolbar />
      <List>
        {categories.map(({ id, name, icon }) => (
          <Link key={id} to="/$" params={{ _splat: id }} preload="intent">
            {({ isActive }) => {
              return (
                <ListItem>
                  <ListItemButton selected={isActive}>
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText>{name}</ListItemText>
                  </ListItemButton>
                </ListItem>
              )
            }}
          </Link>
        ))}
      </List>
      <Typography
        sx={{
          position: "fixed",
          bottom: 10,
          left: 0,
          padding: 2,
          cursor: "pointer",
          textDecoration: "none",
          color: "inherit",
        }}
        component="a"
        href={version.link ? `${version.link}/commit/${version.commit}` : ""}
        target="_blank"
        rel="noopener noreferrer"
        gutterBottom
      >
        Build: {version.version}-{version.commit}
      </Typography>
    </Drawer>
  )
}
