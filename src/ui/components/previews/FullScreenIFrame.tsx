import { FC, memo } from "react"
import FullscreenIcon from "@mui/icons-material/Fullscreen"
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit"
import { Box, IconButton } from "@mui/material"
import { useToggle } from "usehooks-ts"

const FullScreenIF: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullscreen, toggle] = useToggle(false)
  return (
    <Box
      sx={{
        maxWidth: "70%",
        width: "100%",
        margin: "auto",
        padding: "1rem",
        position: "relative",
        height: "90vh",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          ...(fullscreen && {
            position: "fixed",
            top: 0,
            left: 0,
          }),
        }}
      >
        <IconButton
          sx={{
            position: "absolute",
            bottom: "1.2rem",
            right: "1.2rem",
            background: "#1F1F1F",
            zIndex: 102,
          }}
          color="inherit"
          edge="start"
          onClick={toggle}
        >
          {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
        {children}
      </Box>
    </Box>
  )
}

export default memo(FullScreenIF)
