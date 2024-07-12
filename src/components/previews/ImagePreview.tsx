import { memo, useState } from "react";
import IconSvgSpinnerTadpole from "~icons/svg-spinners/tadpole";
import clsx from "clsx";

import { center } from "@/utils/classes";

interface ImagePreviewProps {
  name: string;
  assetUrl: string;
}

const ImagePreview = ({ name, assetUrl }: ImagePreviewProps) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const handleImageOnLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className="max-w-[64rem] m-auto relative">
      {!isLoaded && <IconSvgSpinnerTadpole className={clsx(center, "size-8")} />}

      <img
        onLoad={handleImageOnLoad}
        className={clsx(
          "opacity-0 max-h-[calc(100vh-4rem)] pt-8 mx-auto object-contain transition-opacity duration-300 ease-in-out",
          isLoaded && "opacity-100",
        )}
        src={assetUrl}
        alt={name}
      />
    </div>
  );
};

export default memo(ImagePreview);
