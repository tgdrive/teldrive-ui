import { MouseEventHandler, useContext, useState } from "react"
import ColorModeContext from "@/ui/contexts/colorModeContext"
import ColorIcon from "@mui/icons-material/ColorLensOutlined"
import { Tooltip } from "@mui/material"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import debounce from "lodash.debounce"
import { HexColorPicker } from "react-colorful"

export default function ColorMenu() {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  const open = Boolean(anchorEl)

  const handleClick: MouseEventHandler = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const { schemeColor, setSchemeColor } = useContext(ColorModeContext)

  const debouncedSave = debounce((value: string) => setSchemeColor(value), 200)

  return (
    <>
      <Tooltip title="Change Color">
        <IconButton
          onClick={handleClick}
          color="inherit"
          sx={{ p: 0.5 }}
          aria-controls={open ? "color-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <ColorIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="color-menu"
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              bgcolor: "background.paper",
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem>
          <HexColorPicker color={schemeColor} onChange={debouncedSave} />;
        </MenuItem>
      </Menu>
    </>
  )
}
