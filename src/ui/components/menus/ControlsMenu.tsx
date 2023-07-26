import * as React from "react"
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import StarIcon from "@mui/icons-material/Star"
import StarBorder from "@mui/icons-material/StarBorder"
import IconButton from "@mui/material/IconButton"
import MenuItem from "@mui/material/MenuItem"

import FileMenu from "./FileMenu"

export default function ControlsMenu({ starred, toggleStarred }) {
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null)

  const open = Boolean(anchorEl)

  const handleClick: React.MouseEventHandler = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton
        color="inherit"
        edge="start"
        aria-controls={open ? "controls-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <MoreVertOutlinedIcon />
      </IconButton>
      <FileMenu
        id="controls-menu"
        MenuListProps={{
          "aria-labelledby": "menu-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={toggleStarred} disableRipple>
          {!starred ? <StarBorder /> : <StarIcon />}

          {!starred ? "Starred" : "UnStarred"}
        </MenuItem>

        <MenuItem disableRipple>
          <OpenInNewIcon />
          Open in New Tab
        </MenuItem>
      </FileMenu>
    </>
  )
}
