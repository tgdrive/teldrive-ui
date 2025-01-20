import { lazy, memo, Suspense, useCallback, useState } from "react";
import type { BrowseView } from "@/types";
import { FbIcon, type FileData, useIconData } from "@tw-material/file-browser";
import { Button, Modal, ModalContent } from "@tw-material/react";
import IconIcRoundArrowBack from "~icons/ic/round-arrow-back";
import IconIcRoundNavigateBefore from "~icons/ic/round-navigate-before";
import IconIcRoundNavigateNext from "~icons/ic/round-navigate-next";
import DownloadIcon from "~icons/ic/outline-file-download";

import Loader from "@/components/loader";
import AudioPreview from "@/components/previews/audio/audio-preview";
import DocPreview from "@/components/previews/doc-preview";
import ImagePreview from "@/components/previews/image-preview";
import PDFPreview from "@/components/previews/pdf-preview";
import { WideScreen } from "@/components/previews/wide-screen";
import { mediaUrl } from "@/utils/common";
import { defaultSortState } from "@/utils/defaults";
import { preview } from "@/utils/preview-type";
import { useModalStore } from "@/utils/stores";

import CodePreview from "../previews/code-preview";
import clsx from "clsx";
import { center } from "@/utils/classes";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { $api } from "@/utils/api";

const sortOptions = {
  numeric: true,
  sensitivity: "base",
} as const;

const VideoPreview = lazy(() => import("@/components/previews/video/video-preview"));

const EpubPreview = lazy(() => import("@/components/previews/epub-preview"));

const findNext = (files: FileData[], fileId: string, previewType: string) => {
  let index = -1;
  let firstPreviewIndex = -1;

  for (let i = 0; i < files.length; i++) {
    const matchPreview =
      (previewType === "all" && files[i].previewType) || files[i].previewType === previewType;

    if (index > -1 && matchPreview) {
      return files[i];
    }

    if (firstPreviewIndex === -1 && matchPreview) {
      firstPreviewIndex = i;
    }

    if (files[i].id === fileId) {
      index = i;
    }
    if (i === files.length - 1) {
      return files[firstPreviewIndex];
    }
  }
  return files[0];
};

const findPrev = (files: FileData[], fileId: string, previewType: string) => {
  let index = -1;
  let lastPreviewIndex = -1;
  for (let i = files.length - 1; i >= 0; i--) {
    const matchPreview =
      (previewType === "all" && files[i].previewType) || files[i].previewType === previewType;

    if (index > -1 && matchPreview) {
      return files[i];
    }
    if (lastPreviewIndex === -1 && matchPreview) {
      lastPreviewIndex = i;
    }
    if (files[i].id === fileId) {
      index = i;
    }

    if (i === 0) {
      return files[lastPreviewIndex];
    }
  }
  return files[0];
};

interface ControlButtonProps {
  type: "next" | "prev";
  onPress: () => void;
}

const ControlButton = ({ type, onPress }: ControlButtonProps) => {
  return (
    <Button
      className="data-[hover=true]:bg-zinc-100/hover text-on-surface size-8 min-w-8 px-0"
      variant="text"
      onPress={onPress}
    >
      {type === "next" ? <IconIcRoundNavigateNext /> : <IconIcRoundNavigateBefore />}
    </Button>
  );
};

export default memo(function PreviewModal({
  files: fileProp,
  path,
  view,
}: {
  files: FileData[];
  path: string;
  view: BrowseView;
}) {
  const [files] = useState(
    fileProp.toSorted((a, b) =>
      defaultSortState.order === "asc"
        ? a.name.localeCompare(b.name, undefined, sortOptions)
        : b.name.localeCompare(a.name, undefined, sortOptions),
    ),
  );

  const { actions, open, currentFile } = useModalStore(
    useShallow((state) => ({
      actions: state.actions,
      currentFile: state.currentFile,
      open: state.open,
    })),
  );

  const { id, name, previewType } = currentFile;

  const { icon } = useIconData({ id, name, isDir: false });

  const nextItem = useCallback(
    (previewType = "all") => {
      if (files) {
        const nextItem = findNext(files, id, previewType);
        if (nextItem) {
          actions.setCurrentFile(nextItem);
        }
      }
    },
    [id, files],
  );

  const prevItem = useCallback(
    (previewType = "all") => {
      if (files) {
        const prevItem = findPrev(files, id, previewType);
        if (prevItem) {
          actions.setCurrentFile(prevItem);
        }
      }
    },
    [id, files],
  );
  const { data: fileData } = useQuery({
    ...$api.queryOptions(
      "get",
      "/files/{id}",
      {
        params: {
          path: {
            id,
          },
        },
      },
      {},
    ),
    enabled: view !== "my-drive" && !path,
    select: ({ path, ...data }) => ({
      ...data,
      path: path?.split("/").slice(0, -1).join("/"),
    }),
  });

  const handleClose = useCallback(() => actions.setOpen(false), []);

  const assetUrl = mediaUrl(id, name, view === "my-drive" ? path || "/" : fileData?.path!);

  const renderPreview = useCallback(() => {
    if (previewType) {
      switch (previewType) {
        case preview.video:
          return (
            <Suspense fallback={<Loader />}>
              <div className="w-full max-w-5xl overflow-hidden mx-auto">
                <VideoPreview url={assetUrl} />
              </div>
            </Suspense>
          );

        case preview.pdf:
          return (
            <WideScreen>
              <PDFPreview assetUrl={assetUrl} />
            </WideScreen>
          );

        case preview.office:
          return (
            <WideScreen>
              <DocPreview assetUrl={assetUrl} />
            </WideScreen>
          );

        case preview.code:
          return (
            <WideScreen>
              <CodePreview name={name} assetUrl={assetUrl} />
            </WideScreen>
          );

        case preview.image:
          return <ImagePreview name={name} assetUrl={assetUrl} />;

        case preview.epub:
          return (
            <Suspense fallback={<Loader />}>
              <WideScreen>
                <EpubPreview assetUrl={assetUrl} />
              </WideScreen>
            </Suspense>
          );

        case preview.audio:
          return (
            <AudioPreview nextItem={nextItem} prevItem={prevItem} name={name} assetUrl={assetUrl} />
          );

        default:
          return null;
      }
    }
    return null;
  }, [assetUrl, name, previewType]);

  return (
    <Modal
      aria-labelledby="preview-modal"
      isOpen={open}
      size="5xl"
      classNames={{
        wrapper: "overflow-hidden",
        base: "bg-transparent w-full shadow-none !m-0 rounded-none size-full max-w-screen-2xl",
      }}
      placement="center"
      backdrop="blur"
      onClose={handleClose}
      hideCloseButton
    >
      <ModalContent>
        {id && (
          <div className="px-4 size-full grid grid-rows-[4rem_1fr] gap-2">
            <div className="flex justify-between w-full relative">
              <div className="flex items-center gap-3 w-full max-w-[calc(50%-5rem)]">
                <Button
                  variant="text"
                  className="data-[hover=true]:bg-zinc-300/hover dark:data-[hover=true]:bg-zinc-500/hover text-inherit"
                  onPress={handleClose}
                >
                  <IconIcRoundArrowBack className="size-6" />
                </Button>
                <FbIcon icon={icon} className="size-6 min-w-6 hidden sm:block" />
                <h6
                  className="truncate text-label-large font-normal text-inherit hidden sm:block"
                  title={name}
                >
                  {name}
                </h6>
              </div>
              <div className={clsx(center, "flex items-center absolute gap-4")}>
                <ControlButton type="prev" onPress={() => prevItem()} />
                <ControlButton type="next" onPress={() => nextItem()} />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  as={"a"}
                  href={assetUrl.replace("/stream", "/download")}
                  rel="noopener noreferrer"
                  className="text-on-surface"
                  variant="text"
                  isIconOnly
                >
                  <DownloadIcon />
                </Button>
              </div>
            </div>
            {renderPreview()}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
});
