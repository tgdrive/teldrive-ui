import { FC, useEffect, useState } from "react"
import { useRouter } from "next/router"
import AddToDriveIcon from "@mui/icons-material/AddToDrive"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import StarBorder from "@mui/icons-material/StarBorder"
import WatchLaterIcon from "@mui/icons-material/WatchLater"
import {
  Box,
  Drawer,
  DrawerProps,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material"

import { usePreloadFiles } from "@/ui/hooks/queryhooks"

export const categories = [
  {
    id: "my-drive",
    name: "My Drive",
    icon: <AddToDriveIcon />,
    active: true,
  },
  { id: "starred", name: "Starred", icon: <StarBorder /> },
  { id: "trash", name: "Trash", icon: <DeleteOutlineIcon /> },
  { id: "recent", name: "recent", icon: <WatchLaterIcon /> },
]

const NavDrawer: FC<DrawerProps> = (props) => {
  const { ...others } = props

  const router = useRouter()

  const { path } = router.query

  const [selectedIndex, setSelectedIndex] = useState("")

  const { preloadFiles } = usePreloadFiles()

  useEffect(() => {
    if (path && path.length > 0) setSelectedIndex(path[0])
  }, [path])

  const handleListItemClick = (_: any, index: string) => {
    setSelectedIndex(index)
    preloadFiles(index)
  }

  return (
    <Drawer variant="permanent" {...others}>
      <Toolbar />
      <List>
        {categories.map(({ id: childId, name, icon }) => (
          <ListItem key={childId}>
            <ListItemButton
              selected={selectedIndex == childId}
              onClick={(event) => handleListItemClick(event, childId)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText>{name}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default NavDrawer
