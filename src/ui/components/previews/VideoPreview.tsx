import "plyr-react/plyr.css"

import { FC, forwardRef, memo, useEffect, useRef } from "react"
import { Box, useTheme } from "@mui/material"
import {
  APITypes,
  PlyrOptions,
  PlyrProps,
  PlyrSource,
  usePlyr,
} from "plyr-react"

import { useDevice } from "@/ui/hooks/useDevice"
import { getMediaUrl } from "@/ui/utils/common"

const Plyr = memo(
  forwardRef<APITypes, PlyrProps>((props, ref) => {
    const { source, options = null, ...rest } = props

    const raptorRef = usePlyr(ref, { options, source })

    useEffect(() => {
      const { current } = ref as React.MutableRefObject<APITypes>
      if (current.plyr.source === null) return

      //const api = current as { plyr: PlyrInstance };
    }, [])

    return (
      <video
        ref={raptorRef as React.MutableRefObject<HTMLVideoElement>}
        className="plyr-react plyr"
        {...rest}
      />
    )
  })
)

const VideoPlayer: FC<{
  videoName: string
  videoUrl: string
  isMobile: boolean
}> = ({ videoName, videoUrl }) => {
  const theme = useTheme()

  const plyrSource: PlyrSource = {
    type: "video",
    title: videoName,
    sources: [
      {
        src: videoUrl,
        type: "video/mp4",
      },
    ],
  }
  const plyrOptions: PlyrOptions = {
    blankVideo: "",
    ratio: "16:9",
    iconUrl: "/img/plyr.svg",
    autoplay: true,
    loop: { active: true },
    fullscreen: { iosNative: true },
    keyboard: { focused: true, global: true },
    controls: [
      "play-large",
      "play",
      "rewind",
      "fast-forward",
      "progress",
      "current-time",
      "mute",
      "volume",
      "settings",
      "pip",
      "airplay",
      "fullscreen",
    ],
  }

  const ref = useRef<APITypes>(null)

  return (
    // @ts-expect-error
    <div style={{ "--plyr-color-main": theme.palette.primary.main }}>
      <Plyr ref={ref} id="plyr" source={plyrSource} options={plyrOptions} />
    </div>
  )
}

const VideoPreview: FC<{ id: string; name: string }> = ({ id, name }) => {
  const videoUrl = getMediaUrl(id, name)

  const { isMobile } = useDevice()

  return (
    <>
      <Box
        sx={{
          width: { xs: "100%", md: "70%" },
          margin: "auto",
          padding: "1rem",
        }}
      >
        {isMobile ? (
          <Box className="plyr" sx={{ aspectRatio: "16 /9" }}>
            <Box
              component={"video"}
              sx={{ borderRadius: "4px" }}
              controls
              autoPlay
              src={videoUrl}
            />
          </Box>
        ) : (
          <VideoPlayer
            isMobile={isMobile}
            videoName={name}
            videoUrl={videoUrl}
          />
        )}
      </Box>
    </>
  )
}
export default memo(VideoPreview)
