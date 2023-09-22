import { FC, useEffect, useState } from "react"
import { AudioMetadata } from "@/ui/types"
import { Box, Typography } from "@mui/material"
import Skeleton from "@mui/material/Skeleton"
import useMediaQuery from "@mui/material/useMediaQuery"

import CoverArt from "./CoverArt"
import MediaControlButtons from "./MediaControlButtons"
import MediaFunctionButtons from "./MediaFunctionButtons"
import TimeScaleBar from "./TimeScaleBar"

interface PlayerProps {
  metadata: AudioMetadata
}

const AudioPlayer: FC<PlayerProps> = ({ metadata }) => {
  const isM = useMediaQuery("(max-width:900px)")
  const isSm = useMediaQuery("(max-width:500px)")

  return (
    <Box
      display="flex"
      flexDirection={isM ? "column" : "row"}
      alignItems="center"
      justifyContent="center"
    >
      {metadata.cover && <CoverArt imageUrl={metadata.cover} />}

      <Box p={2} minWidth={isSm ? "250px" : "350px"}>
        <Typography
          variant="h5"
          component="h1"
          textAlign="center"
          mt={1}
          fontWeight={600}
        >
          {metadata.title}
        </Typography>

        <Typography
          variant="h6"
          component="h2"
          mb={1}
          textAlign="center"
          color="primary"
        >
          {metadata.artist}
        </Typography>
        <TimeScaleBar />
        <MediaControlButtons />
        <MediaFunctionButtons />
      </Box>
    </Box>
  )
}

export default AudioPlayer
