import { useEffect, useState } from "react"
import BottomNavigation from "@mui/material/BottomNavigation"
import BottomNavigationAction from "@mui/material/BottomNavigationAction"
import Paper from "@mui/material/Paper"
import { useNavigate, useParams } from "react-router-dom"

import { categories } from "./Drawer"

export default function FixedBottomNavigation() {
  const [value, setValue] = useState("")

  const navigate = useNavigate()

  const { type } = useParams()

  useEffect(() => {
    if (type) setValue(type)
  }, [type])

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
            onClick={() => navigate(id)}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
