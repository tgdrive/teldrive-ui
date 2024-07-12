import type React from "react";
import { FC, forwardRef, memo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useParams } from "@tanstack/react-router";
import { Button } from "@tw-material/react";
import FlatColorIconsVlc from "~icons/flat-color-icons/vlc";
import SolarPlayCircleBold from "~icons/solar/play-circle-bold";
import type Artplayer from "artplayer";
import type ArtOption from "artplayer/types/option";
import type { AspectRatio } from "artplayer/types/player";

import { mediaUrl } from "@/utils/common";
import { sessionQueryOptions } from "@/utils/queryOptions";

import Player from "./ArtPlayer";

const aspectRatioes = ["default", "4:3", "16:9"];

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  videoName: string;
  videoUrl: string;
  style?: React.CSSProperties;
}
const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ videoName, videoUrl, style = {}, ...props }) => {
    const artInstance = useRef<Artplayer | null>(null);
    const artOptions: ArtOption = {
      container: "",
      url: "",
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

    useEffect(() => {
      if (artInstance.current && videoUrl) {
        artInstance.current.switchUrl(videoUrl);
        artInstance.current.title = videoName;
      }
      return () => {
        if (artInstance.current) {
          artInstance.current.video.pause();
          artInstance.current.video.removeAttribute("src");
          artInstance.current.video.load();
        }
      };
    }, [videoUrl]);

    return (
      <div className="relative">
        <Player
          {...props}
          style={style}
          option={artOptions}
          getInstance={(art) => {
            artInstance.current = art;
            art.hotkey.add(65, (_: Event) => {
              art.aspectRatio = aspectRatioes[
                (aspectRatioes.findIndex((val) => val === art.aspectRatio) + 1) %
                  aspectRatioes.length
              ] as AspectRatio;
            });
          }}
        />
      </div>
    );
  },
);

const fileRoute = getRouteApi("/_authenticated/watch/$id/$name");

export const VideoSoloPreview = memo(() => {
  const { id, name } = fileRoute.useParams();
  const { data: session } = useQuery(sessionQueryOptions);
  const assetUrl = mediaUrl(id, name, session?.hash!);
  return (
    <div className="relative mx-auto mt-4 max-w-4xl">
      <VideoPlayer className="aspect-[16/9]" videoName={name} videoUrl={assetUrl} />

      <div className="flex relative flex-col mt-4 gap-4">
        <div className="grid grid-cols-6 gap-x-2">
          <h1 className="text-base sm:text-xl  mr-auto font-medium col-span-full md:col-span-5 break-all">
            {name}
          </h1>
          <div className="inline-flex gap-2 relative col-span-full md:col-span-1">
            <Button
              as="a"
              isIconOnly
              variant="text"
              rel="noopener noreferrer"
              href={`potplayer://${assetUrl}`}
            >
              <SolarPlayCircleBold />
            </Button>
            <Button
              as="a"
              isIconOnly
              variant="text"
              rel="noopener noreferrer"
              href={`vlc://${assetUrl}`}
            >
              <FlatColorIconsVlc />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
VideoSoloPreview.displayName = "VideoSoloPreview";
