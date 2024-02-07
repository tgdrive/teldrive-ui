import { MouseEventHandler, useCallback, useState } from "react"
import { Message } from "@/types"
import Logout from "@mui/icons-material/Logout"
import Settings from "@mui/icons-material/Settings"
import Avatar from "@mui/material/Avatar"
import IconButton from "@mui/material/IconButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { useSession } from "@/hooks/useSession"
import useSettings from "@/hooks/useSettings"
import SettingsDialog from "@/components/Settings"
import http from "@/utils/http"

export default function AccountMenu() {
  const { settings } = useSettings()
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  const [settingsOpen, setSettingsOpen] = useState(false)

  const open = Boolean(anchorEl)

  const handleClick: MouseEventHandler = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const { data: session, refetch } = useSession()

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const signOut = useCallback(async () => {
    const res = await http.post<Message>("/api/auth/logout")
    refetch()
    if (res.status === 200) {
      queryClient.removeQueries()
      navigate({ to: "/login", replace: true })
    }
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
        {session?.name ? (
          <Avatar
            alt="profile"
            sx={{
              width: 28,
              height: 28,
            }}
            src={`/api/users/profile?photo=1&hash=${session.hash}`}
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
            U
          </Avatar>
        )}
      </IconButton>
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
        {session && (
          <MenuItem onClick={handleClose}>{session?.userName}</MenuItem>
        )}
        <MenuItem onClick={() => setSettingsOpen(true)}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        {session && (
          <MenuItem onClick={() => signOut()}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        )}
      </Menu>
      {settingsOpen && (
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
