import { memo, useRef } from "react";
import type Artplayer from "artplayer";
import type { Option } from "artplayer";
import { Player } from "./art-player";

interface VideoPlayerProps {
  url: string;
}
const VideoPlayer = memo(({ url, ...props }: VideoPlayerProps) => {
  const artInstance = useRef<Artplayer | null>(null);
  const artOptions: Option = {
    container: "",
    url,
    volume: 0.6,
    muted: false,
    autoplay: true,
    pip: true,
    autoSize: false,
    autoMini: true,
    screenshot: true,
    setting: true,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    mutex: true,
    backdrop: true,
    hotkey: true,
    playsInline: true,
    autoPlayback: true,
    airplay: true,
    lock: true,
    fastForward: true,
    autoOrientation: true,
    moreVideoAttr: {
      playsInline: true,
    },
  };

  return (
    <Player
      style={{ aspectRatio: "16 /9" }}
      ref={artInstance}
      option={artOptions}
      {...props}
    />
  );
});

export default memo(VideoPlayer);
