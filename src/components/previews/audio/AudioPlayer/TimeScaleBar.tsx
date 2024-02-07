import { useContext, useEffect, useState } from "react"
import { Box, Slider, Typography } from "@mui/material"

import {
  AudioContext,
  AudioContextType,
} from "@/components/previews/audio/AudioPreview"
import { formatDuration } from "@/utils/common"

const TimeScaleBar = () => {
  const { duration, seek, player } = useContext(
    AudioContext
  ) as AudioContextType

  const [position, setPosition] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPosition(Math.floor(player.currentTime))
    }, 1000)

    return () => clearInterval(timer)
  }, [duration])

  return (
    <Box>
      <Slider
        size="small"
        aria-label="Progress Bar"
        value={position}
        min={0}
        step={1}
        max={duration}
        onChange={(_, value) => seek(value as number)}
        sx={{
          "& .MuiSlider-thumb": {
            transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
            "&:before": {
              boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
            },
            "&.Mui-active": {
              width: 20,
              height: 20,
            },
          },
          "& .MuiSlider-rail": {
            opacity: 0.28,
          },
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: -2,
        }}
      >
        <Typography>{formatDuration(position)}</Typography>
        <Typography>{formatDuration(duration)}</Typography>
      </Box>
    </Box>
  )
}

export default TimeScaleBar
