import { FC, useEffect, useState } from "react"
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
import { useParams } from "react-router-dom"

import { usePreloadFiles } from "@/ui/hooks/queryhooks"
import { getParams } from "@/ui/utils/common"

import version from "../../../version.json"

export const categories = [
  {
    id: "my-drive",
    name: "My Drive",
    icon: <AddToDriveIcon />,
    active: true,
  },
  { id: "starred", name: "Starred", icon: <StarBorder /> },
  { id: "recent", name: "recent", icon: <WatchLaterIcon /> },
]

const NavDrawer: FC<DrawerProps> = (props) => {
  const { ...others } = props

  const params = getParams(useParams())
  const { type } = params

  const { preloadFiles } = usePreloadFiles()

  const [selectedIndex, setSelectedIndex] = useState("")

  useEffect(() => {
    if (type) setSelectedIndex(type)
  }, [type])

  const handleListItemClick = (_: any, index: string) => {
    setSelectedIndex(index)
    preloadFiles({ type: index, path: "" })
  }

  return (
    <Drawer variant="permanent" {...others}>
      <Toolbar />
      <List>
        {categories.map(({ id: childId, name, icon }) => (
          <ListItem key={childId}>
            <ListItemButton
              selected={selectedIndex === childId}
              onClick={(event) => handleListItemClick(event, childId)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText>{name}</ListItemText>
            </ListItemButton>
          </ListItem>
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
        href={version.link}
        target="_blank"
        rel="noopener noreferrer"
        gutterBottom
      >
        Build: {version.version}-{version.commit}
      </Typography>
    </Drawer>
  )
}

export default NavDrawer
