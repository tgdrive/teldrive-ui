import PauseIcon from "@mui/icons-material/Pause"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { Box, IconButton, Stack } from "@mui/material"
import { useGlobalAudioPlayer } from "react-use-audio-player"

const MediaControlButtons = () => {
  const { togglePlayPause, playing } = useGlobalAudioPlayer()

  return (
    <Box>
      <Stack
        spacing={2}
        direction="row"
        sx={{ mb: 1 }}
        alignItems="center"
        justifyContent="space-evenly"
      >
        <IconButton sx={{ fontSize: 55 }} onClick={() => togglePlayPause()}>
          {playing ? (
            <PauseIcon fontSize="inherit" />
          ) : (
            <PlayArrowIcon fontSize="inherit" />
          )}
        </IconButton>
      </Stack>
    </Box>
  )
}

export default MediaControlButtons
