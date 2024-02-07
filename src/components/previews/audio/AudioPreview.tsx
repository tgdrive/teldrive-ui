import {
  createContext,
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { AudioMetadata, Tags } from "@/types"
import { Paper } from "@mui/material"
import { useEventListener } from "usehooks-ts"

import parseAudioMetadata from "@/utils/tagparser"

import AudioPlayer from "./AudioPlayer"

const defaultCover = "/images/cover.png"

type PlayerState = {
  playing: boolean
  currentTime: number
  duration: number
  looping: boolean
  muted: boolean
  volume: number
  ended: boolean
}
const useAudio = () => {
  const audio = useRef(new Audio())

  const [playerState, setPlayerState] = useState<PlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    looping: false,
    muted: false,
    volume: 1,
    ended: false,
  })

  const load = useCallback((url: string) => {
    audio.current.src = url
    audio.current.autoplay = true
    audio.current.volume = playerState.volume
    audio.current.loop = playerState.looping
    audio.current.muted = playerState.muted
    audio.current.load()
    audio.current.play()
    setPlayerState((prev) => ({ ...prev, ended: false }))
  }, [])

  const seek = useCallback((value: number) => {
    audio.current.currentTime = value
    setPlayerState((prev) => ({ ...prev, currentTime: value }))
  }, [])

  const setVolume = useCallback((value: number) => {
    audio.current.volume = value
    setPlayerState((prev) => ({ ...prev, volume: value }))
  }, [])

  const togglePlay = useCallback(() => {
    const player = audio.current
    return player.paused && player.currentTime >= 0 && !player.ended
      ? player.play()
      : player.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const player = audio.current
    player.muted = !player.muted
    setPlayerState((prev) => ({ ...prev, muted: player.muted }))
  }, [])

  const toggleLooping = useCallback(() => {
    const player = audio.current
    player.loop = !player.loop
    setPlayerState((prev) => ({ ...prev, looping: player.loop }))
  }, [])

  useEventListener(
    "play",
    () => setPlayerState((prev) => ({ ...prev, playing: true })),
    audio
  )

  useEventListener(
    "pause",
    () => setPlayerState((prev) => ({ ...prev, playing: false })),
    audio
  )

  useEventListener(
    "loadedmetadata",
    () =>
      setPlayerState((prev) => ({ ...prev, duration: audio.current.duration })),
    audio
  )
  useEventListener(
    "ended",
    () => setPlayerState((prev) => ({ ...prev, ended: true })),
    audio
  )

  return {
    player: audio.current,
    load,
    seek,
    setVolume,
    togglePlay,
    toggleMute,
    toggleLooping,
    isPlaying: playerState.playing,
    volume: playerState.volume,
    muted: playerState.muted,
    looping: playerState.looping,
    duration: playerState.duration,
    currentTime: playerState.currentTime,
    ended: playerState.ended,
  }
}

export type AudioContextType = ReturnType<typeof useAudio> & {
  nextItem: (previewType: string) => void
  prevItem: (previewType: string) => void
}

export const AudioContext = createContext<AudioContextType | null>(null)

const AudioPreview: FC<{
  nextItem: (previewType: string) => void
  prevItem: (previewType: string) => void
  mediaUrl: string
  name: string
}> = ({ mediaUrl, name, nextItem, prevItem }) => {
  const player = useAudio()

  const [metadata, setMetadata] = useState<AudioMetadata>({
    artist: "Unkown artist",
    title: "Unkown title",
    cover: defaultCover,
  })

  useEffect(() => {
    if (mediaUrl) {
      parseAudioMetadata(mediaUrl).then((tags) => {
        let { artist, title, picture } = tags as Tags
        let cover = defaultCover
        if (picture) {
          cover = URL.createObjectURL(picture as unknown as Blob)
        }
        setMetadata({
          artist: artist ? artist : "Unkown artist",
          title: title ? title : name,
          cover,
        })
      })
      player.load(mediaUrl)
    }
  }, [mediaUrl, name])

  useEffect(() => {
    return () => {
      player.player.pause()
      player.player.src = ""
      player.player.load()
    }
  }, [])

  useEffect(() => {
    if (player.ended) {
      nextItem("audio")
    }
  }, [player.ended])

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
      <AudioContext.Provider value={{ ...player, nextItem, prevItem }}>
        <AudioPlayer metadata={metadata} />
      </AudioContext.Provider>
    </Paper>
  )
}

export default memo(AudioPreview)
