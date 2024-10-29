import { forwardRef, useEffect, useRef } from "react";
import { Artplayer, type AspectRatio, type Option } from "@artplayer/player";
import "@artplayer/player/artplayer.css";

Artplayer.USE_RAF = true;

interface PlayerProps {
  option: Option;
  style: React.CSSProperties;
}

const aspectRatioes = ["default", "4:3", "16:9"];

export const Player = forwardRef<Artplayer, PlayerProps>(
  ({ option, ...rest }, ref) => {
    const artRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const art = new Artplayer({
        ...option,
        container: artRef.current!,
      });
      art.hotkey.add("a", (_: Event) => {
        art.aspectRatio = aspectRatioes[
          (aspectRatioes.findIndex((val) => val === art.aspectRatio) + 1) %
            aspectRatioes.length
        ] as AspectRatio;
      });
      if (ref && typeof ref !== "function") ref.current = art;
      else if (ref && typeof ref === "function") ref(art);

      return () => {
        if (art?.destroy) {
          art.video.pause();
          art.video.removeAttribute("src");
          art.video.load();
          art.destroy(false);
        }
      };
    }, [option]);
    return <div ref={artRef} {...rest} />;
  }
);
