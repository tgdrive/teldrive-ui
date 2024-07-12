import type Artplayer from "artplayer";
import type { Utils } from "artplayer/types/utils";

interface ThumbnailOption {
  url: string;
  size: number;
  height: number;
  width: number;
  scaledWidth?: number;
}

export function artplayerPluginThumbnail(option: ThumbnailOption) {
  return (art: Artplayer) => {
    const {
      constructor: {
        utils: { setStyle, clamp },
      },
      template: { $progress },
      events: { proxy, loadImg },
    } = art as Artplayer & { constructor: { utils: Utils } };

    function getPosFromEvent(art: Artplayer, event: MouseEvent) {
      const { $progress } = art.template;
      const { left } = $progress.getBoundingClientRect();
      const width = clamp(event.pageX - left, 0, $progress.clientWidth);
      const second = (width / $progress.clientWidth) * art.duration;
      return { width, second };
    }

    art.controls.add({
      name: "thumbnails",
      position: "top",
      index: 20,
      mounted: ($control: HTMLElement) => {
        let image: HTMLImageElement | null = null;
        let loading = false;
        let isLoad = false;
        let isHover = false;

        function showThumbnails(event: MouseEvent) {
          const { width: posWidth } = getPosFromEvent(art, event);
          let { url, size, width, height, scaledWidth } = option;

          const number = size * size;

          const perWidth = $progress.clientWidth / number;
          const perIndex = Math.floor(posWidth / perWidth);
          const yIndex = Math.ceil(perIndex / size) - 1;
          const xIndex = perIndex % size || size - 1;

          let scale = 1,
            scaledHeight = height,
            scaledXOffset = 0,
            scaledYOffset = 0;

          if (scaledWidth) {
            scale = scaledWidth / width;
            scaledHeight = height * scale;
            scaledXOffset = (width - scaledWidth) / 2;
            scaledYOffset = (height - scaledHeight) / 2;
            setStyle($control, "transform", `scale(${scale})`);
            setStyle($control, "bottom", `${15 - scaledYOffset}px`);
          } else scaledWidth = width;

          setStyle($control, "backgroundImage", `url(${url})`);
          setStyle($control, "height", `${height}px`);
          setStyle($control, "width", `${width}px`);
          setStyle($control, "backgroundPosition", `-${xIndex * width}px -${yIndex * height}px`);
          if (posWidth <= scaledWidth / 2) {
            setStyle($control, "left", `${-scaledXOffset}px`);
          } else if (posWidth > $progress.clientWidth - scaledWidth / 2) {
            setStyle($control, "left", `${$progress.clientWidth - width + scaledXOffset}px`);
          } else {
            setStyle($control, "left", `${posWidth - width / 2}px`);
          }
        }

        proxy($progress, "mousemove", async (event: MouseEvent | Event) => {
          isHover = true;
          if (!loading) {
            loading = true;
            const img = await loadImg(option.url);
            image = img;
            isLoad = true;
          }

          if (isLoad && isHover) {
            setStyle($control, "display", "flex");
            showThumbnails(event as MouseEvent);
          }
        });

        proxy($progress, "mouseleave", () => {
          isHover = false;
          setStyle($control, "display", "none");
        });

        art.on("hover", (state) => {
          if (!state) {
            setStyle($control, "display", "none");
          }
        });
      },
    });
  };
}
