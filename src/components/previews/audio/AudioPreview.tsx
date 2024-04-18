import { memo, useEffect } from "react"

import { audioActions, useAudioStore } from "@/utils/stores/audio"

import { AudioPlayer } from "./AudioPlayer"

interface AudioPreviewProps {
  nextItem: (previewType: string) => void
  prevItem: (previewType: string) => void
  assetUrl: string
  name: string
}

const AudioPreview = ({
  assetUrl,
  name,
  nextItem,
  prevItem,
}: AudioPreviewProps) => {
  const actions = useAudioStore(audioActions)

  useEffect(() => {
    if (assetUrl) actions.loadAudio(assetUrl, name)
  }, [assetUrl])

  return <AudioPlayer nextItem={nextItem} prevItem={prevItem} />
}

export default memo(AudioPreview)
