import {
  Dispatch,
  FC,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react"
import { AudioMetadata, PreviewFile, Tags } from "@/ui/types"
import { Paper } from "@mui/material"
import { useGlobalAudioPlayer } from "react-use-audio-player"

import parseAudioMetadata from "@/ui/utils/tagparser"

import AudioPlayer from "./AudioPlayer"

const defaultCover = "/img/cover.png"

const AudioPreview: FC<{
  setCurrIndex: Dispatch<SetStateAction<number>>
  previews?: PreviewFile[]
  currIndex: number
  mediaUrl: string
  name: string
}> = ({ setCurrIndex, currIndex, previews, mediaUrl, name }) => {
  const player = useGlobalAudioPlayer()

  const [end, setEnd] = useState(false)

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
        onend: () => setEnd(true),
      })
    }

    return () => player.stop()
  }, [mediaUrl, name])

  const playNext = useCallback(() => {
    let index = currIndex + 1
    if (index >= previews!?.length) index = 0
    index =
      previews!.slice(index).findIndex((x) => x.previewType === "audio") + index

    setCurrIndex(index)
  }, [currIndex])

  const playPrev = useCallback(() => {
    let index = currIndex - 1
    if (index < 0) index = previews!?.length - 1

    index = previews!
      .slice(0, index + 1)
      .findLastIndex((x) => x.previewType === "audio")
    setCurrIndex(index)
  }, [currIndex])

  useEffect(() => {
    if (end && !player.looping) {
      playNext()
      setEnd(false)
    }
  }, [end, player.looping])

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
      <AudioPlayer
        playNext={playNext}
        playPrev={playPrev}
        metadata={metadata}
      />
    </Paper>
  )
}

export default memo(AudioPreview)
