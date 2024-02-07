import { memo, useContext } from "react"
import PauseIcon from "@mui/icons-material/Pause"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import SkipNextIcon from "@mui/icons-material/SkipNext"
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious"
import { Box, IconButton, Stack } from "@mui/material"

import {
  AudioContext,
  AudioContextType,
} from "@/components/previews/audio/AudioPreview"

const MediaControlButtons = () => {
  const { nextItem, prevItem, isPlaying, togglePlay } = useContext(
    AudioContext
  ) as AudioContextType

  return (
    <Box>
      <Stack
        spacing={2}
        direction="row"
        sx={{ mb: 1 }}
        alignItems="center"
        justifyContent="space-evenly"
      >
        <IconButton sx={{ fontSize: 40 }} onClick={() => prevItem("audio")}>
          <SkipPreviousIcon fontSize="inherit" />
        </IconButton>
        <IconButton sx={{ fontSize: 40 }} onClick={togglePlay}>
          {isPlaying ? (
            <PauseIcon fontSize="inherit" />
          ) : (
            <PlayArrowIcon fontSize="inherit" />
          )}
        </IconButton>

        <IconButton sx={{ fontSize: 40 }} onClick={() => nextItem("audio")}>
          <SkipNextIcon fontSize="inherit" />
        </IconButton>
      </Stack>
    </Box>
  )
}

export default memo(MediaControlButtons)
