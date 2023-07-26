import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import BottomNavigation from "@mui/material/BottomNavigation"
import BottomNavigationAction from "@mui/material/BottomNavigationAction"
import Paper from "@mui/material/Paper"

import { usePreloadFiles } from "@/ui/hooks/queryhooks"

import { categories } from "./Drawer"

export default function FixedBottomNavigation() {
  const [value, setValue] = useState("")

  const router = useRouter()

  const { path } = router.query

  const { preloadFiles } = usePreloadFiles()

  useEffect(() => {
    if (path && path.length > 0) setValue(path[0])
  }, [path])

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
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue)
        }}
      >
        {categories.map(({ id, name, icon }) => (
          <BottomNavigationAction
            key={id}
            value={id}
            label={name}
            icon={icon}
            onClick={() => preloadFiles(id)}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
