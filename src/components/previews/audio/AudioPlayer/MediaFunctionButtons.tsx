import { useContext } from "react"
import RepeatIcon from "@mui/icons-material/Repeat"
import RepeatOneIcon from "@mui/icons-material/RepeatOne"
import VolumeOffIcon from "@mui/icons-material/VolumeOff"
import VolumeUpIcon from "@mui/icons-material/VolumeUp"
import { Box, IconButton, Slider, Stack, Typography } from "@mui/material"

import {
  AudioContext,
  AudioContextType,
} from "@/components/previews/audio/AudioPreview"

const MediaFunctionButtons = () => {
  const { setVolume, volume, toggleMute, muted, looping, toggleLooping } =
    useContext(AudioContext) as AudioContextType

  const handleVolumeChange = (event: Event, newValue: number | number[]) =>
    setVolume(newValue as number)

  return (
    <Box>
      <Stack
        spacing={0}
        direction="row"
        sx={{ mb: 1 }}
        alignItems="center"
        justifyContent="flex-start"
      >
        <IconButton onClick={toggleLooping}>
          {looping ? <RepeatOneIcon color="primary" /> : <RepeatIcon />}
        </IconButton>
        <Box width={1} ml={2}>
          <Stack
            spacing={2}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <IconButton onClick={toggleMute}>
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            <Slider
              size="small"
              aria-label="Volume"
              min={0}
              step={0.01}
              max={1}
              value={volume}
              onChange={handleVolumeChange}
            />
            <Box>
              <Typography width={40} display="block">
                {Math.floor(volume * 100)}%
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export default MediaFunctionButtons
