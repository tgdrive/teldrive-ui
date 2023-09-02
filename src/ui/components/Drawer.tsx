import { FC, useEffect, useState } from "react"
import { useRouter } from "next/router"
import AddToDriveIcon from "@mui/icons-material/AddToDrive"
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined"
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

import { TELDRIVE_OPTIONS } from "../const"

export const categories = [
  {
    id: TELDRIVE_OPTIONS.myDrive.id,
    name: TELDRIVE_OPTIONS.myDrive.name,
    icon: <AddToDriveIcon />,
    active: true,
  },
  {
    id: TELDRIVE_OPTIONS.starred.id,
    name: TELDRIVE_OPTIONS.starred.name,
    icon: <StarBorder />,
  },
  {
    id: TELDRIVE_OPTIONS.shared.id,
    name: TELDRIVE_OPTIONS.shared.name,
    icon: <FolderSharedOutlinedIcon />,
  },
  {
    id: TELDRIVE_OPTIONS.recent.id,
    name: TELDRIVE_OPTIONS.recent.name,
    icon: <WatchLaterIcon />,
  },
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
