import { MouseEventHandler, useCallback, useState } from "react"
import { Message } from "@/ui/types"
import Logout from "@mui/icons-material/Logout"
import Settings from "@mui/icons-material/Settings"
import Avatar from "@mui/material/Avatar"
import IconButton from "@mui/material/IconButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"

import http from "@/ui/utils/http"

type AccountMenuProps = {
  session: Record<string, any>
}
export default function AccountMenu({ session }: AccountMenuProps) {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  const open = Boolean(anchorEl)

  const handleClick: MouseEventHandler = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const signOut = useCallback(async () => {
    const res = await http.get("/api/auth/logout").json<Message>()
    if (res.status) window.location.pathname = "/login"
  }, [])

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        sx={{ p: 0.5 }}
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        {session?.user?.image ? (
          <Avatar
            alt="profile"
            sx={{
              width: 28,
              height: 28,
            }}
            src={session?.user?.image}
          />
        ) : (
          <Avatar
            alt="profile"
            sx={{
              bgcolor: "secondaryContainer.contrastText",
              width: 28,
              height: 28,
              fontSize: 16,
            }}
          >
            M
          </Avatar>
        )}
      </IconButton>
      {session && (
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
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
          <MenuItem onClick={handleClose}>{session?.user?.name}</MenuItem>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <MenuItem onClick={() => signOut()}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      )}
    </>
  )
}
