import { FC, memo, useEffect, useState } from "react"
import { AudioMetadata, Tags } from "@/ui/types"
import { Paper } from "@mui/material"
import { useGlobalAudioPlayer } from "react-use-audio-player"

import parseAudioMetadata from "@/ui/utils/tagparser"

import AudioPlayer from "./AudioPlayer"

const defaultCover =
  "https://player.listenlive.co/templates/StandardPlayerV4/webroot/img/default-cover-art.png"

const AudioPreview: FC<{ mediaUrl: string; name: string }> = ({
  mediaUrl,
  name,
}) => {
  const player = useGlobalAudioPlayer()

  const [metadata, setMetadata] = useState<AudioMetadata>({
    artist: "Unkown artist",
    title: "Unkown title",
    cover: defaultCover,
  })

  useEffect(() => {
    if (mediaUrl) {
      setMetadata({
        artist: "Unkown artist",
        title: name,
        cover: defaultCover,
      })
      parseAudioMetadata(mediaUrl).then((tags) => {
        let { artist, title, picture } = tags as Tags
        let cover = defaultCover
        if (picture) {
          cover = URL.createObjectURL(picture as Blob)
        }
        setMetadata({
          artist: artist ? artist : "Unkown artist",
          title: title ? title : name,
          cover,
        })
      })
      player.load(mediaUrl, {
        html5: true,
        autoplay: true,
        initialVolume: 0.6,
      })
    }

    return () => player.stop()
  }, [mediaUrl, name])
  return (
    <Paper
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        borderRadius: 2,
        width: "auto",
      }}
      elevation={10}
    >
      <AudioPlayer metadata={metadata} />
    </Paper>
  )
}

export default memo(AudioPreview)
