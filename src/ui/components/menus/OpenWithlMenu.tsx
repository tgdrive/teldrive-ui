import * as React from "react"
import FileCopyIcon from "@mui/icons-material/FileCopy"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { alpha, Box } from "@mui/material"
import Button from "@mui/material/Button"
import MenuItem from "@mui/material/MenuItem"

import { navigateToExternalUrl } from "@/ui/utils/common"
import { preview } from "@/ui/utils/getPreviewType"

import FileMenu from "./FileMenu"

interface OpenWithMenuProps {
  previewType: string
  videoUrl: string
}

export default function OpenWithMenu({
  previewType,
  videoUrl,
}: OpenWithMenuProps) {
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
      <Button
        id="demo-customized-button"
        aria-controls={open ? "demo-customized-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="outlined"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          backgroundColor: alpha("#121212", 0.75),
          border: `2px solid ${alpha("#FFFFFF", 0.52)} !important`,
          color: "#C4C7C5",
          "&:hover": {
            backgroundColor: alpha("#121212", 0.45),
          },
          transition: "none",
        }}
      >
        Open With
      </Button>
      <FileMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {previewType === preview.video && (
          <Box>
            <MenuItem
              onClick={() => {
                navigateToExternalUrl(`vlc://${videoUrl}`, false)
                handleClose()
              }}
              disableRipple
            >
              <FileCopyIcon />
              Open In VLC
            </MenuItem>
            <MenuItem
              onClick={() => {
                navigateToExternalUrl(`potplayer://${videoUrl}`, false)
                handleClose()
              }}
              disableRipple
            >
              <FileCopyIcon />
              Open In PotPlayer
            </MenuItem>
          </Box>
        )}
      </FileMenu>
    </>
  )
}
