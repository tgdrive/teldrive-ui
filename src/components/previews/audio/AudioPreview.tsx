import { memo, useEffect } from "react"

import { audioActions, useAudioStore } from "@/utils/stores/audio"

import { AudioPlayer } from "./AudioPlayer"

interface AudioPreviewProps {
  nextItem: (previewType: string) => void
  prevItem: (previewType: string) => void
  assetUrl: string
  name: string
}

const unloadAudio = (audio: HTMLAudioElement) => {
  audio.pause()
  audio.src = ""
  audio.load()
  audio.remove()
}

const AudioPreview = ({
  assetUrl,
  name,
  nextItem,
  prevItem,
}: AudioPreviewProps) => {
  const actions = useAudioStore(audioActions)

  const audio = useAudioStore((state) => state.audio)

  useEffect(() => {
    return () => {
      if (audio) {
        unloadAudio(audio)
        actions.reset()
      }
    }
  }, [audio])

  useEffect(() => {
    if (assetUrl) {
      actions.setHandlers({
        prevItem,
        nextItem,
      })
      actions.loadAudio(assetUrl, name)
    }
  }, [assetUrl, prevItem, nextItem])

  return <AudioPlayer />
}

export default memo(AudioPreview)
