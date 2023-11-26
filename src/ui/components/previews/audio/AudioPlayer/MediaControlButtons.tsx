import { memo } from "react"
import PauseIcon from "@mui/icons-material/Pause"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious"
import { Box, IconButton, Stack } from "@mui/material"
import { useGlobalAudioPlayer } from "react-use-audio-player"

interface MediaControlProps {
  playPrev: () => void
  playNext: () => void
}

const MediaControlButtons = ({ playNext, playPrev }: MediaControlProps) => {
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
        <IconButton sx={{ fontSize: 40 }} onClick={playPrev}>
          <SkipPreviousIcon fontSize="inherit" />
        </IconButton>
        <IconButton sx={{ fontSize: 40 }} onClick={togglePlayPause}>
          {playing ? (
            <PauseIcon fontSize="inherit" />
          ) : (
            <PlayArrowIcon fontSize="inherit" />
          )}
        </IconButton>

        <IconButton sx={{ fontSize: 40 }} onClick={playNext}>
          <SkipNextIcon fontSize="inherit" />
        </IconButton>
      </Stack>
    </Box>
  )
}

export default memo(MediaControlButtons)
