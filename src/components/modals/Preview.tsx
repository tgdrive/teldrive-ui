import { lazy, memo, Suspense, useCallback } from "react"
import { Session } from "@/types"
import { FbIcon, FileData, useIconData } from "@tw-material/file-browser"
import { Box, Button, Modal, ModalContent } from "@tw-material/react"
import IconIcRoundArrowBack from "~icons/ic/round-arrow-back"
import IconIcRoundNavigateBefore from "~icons/ic/round-navigate-before"
import IconIcRoundNavigateNext from "~icons/ic/round-navigate-next"
import clsx from "clsx"

import Loader from "@/components/Loader"
import AudioPreview from "@/components/previews/audio/AudioPreview"
import DocPreview from "@/components/previews/DocPreview"
import ImagePreview from "@/components/previews/ImagePreview"
import PDFPreview from "@/components/previews/PdfPreview"
import { WideScreen } from "@/components/previews/WideScreen"
import { mediaUrl } from "@/utils/common"
import { preview } from "@/utils/getPreviewType"
import { useModalStore } from "@/utils/stores"

import CodePreview from "../previews/CodePreview"

const VideoPreview = lazy(
  () => import("@/components/previews/video/VideoPreview")
)

const EpubPreview = lazy(() => import("@/components/previews/EpubPreview"))

const findNext = (files: FileData[], fileId: string, previewType: string) => {
  let index = -1,
    firstPreviewIndex = -1

  for (let i = 0; i < files.length; i++) {
    const matchPreview =
      (previewType == "all" && files[i].previewType) ||
      files[i].previewType == previewType

    if (index > -1 && matchPreview) {
      return files[i]
    }

    if (firstPreviewIndex === -1 && matchPreview) {
      firstPreviewIndex = i
    }

    if (files[i].id === fileId) {
      index = i
    }
    if (i === files.length - 1) {
      return files[firstPreviewIndex]
    }
  }
  return 0
}

const findPrev = (files: FileData[], fileId: string, previewType: string) => {
  let index = -1,
    lastPreviewIndex = -1
  for (let i = files.length - 1; i >= 0; i--) {
    const matchPreview =
      (previewType == "all" && files[i].previewType) ||
      files[i].previewType == previewType

    if (index > -1 && matchPreview) {
      return files[i]
    }
    if (lastPreviewIndex === -1 && matchPreview) {
      lastPreviewIndex = i
    }
    if (files[i].id === fileId) {
      index = i
    }

    if (i === 0) {
      return files[lastPreviewIndex]
    }
  }
  return 0
}

interface ControlButtonProps {
  type: "next" | "prev"
  onPress: () => void
}

const ControlButton = ({ type, onPress }: ControlButtonProps) => {
  return (
    <Box
      className={clsx(
        "w-10  opacity-0 data-[hover=true]:opacity-100 transition-opacity ease-out",
        "h-[calc(100vh-4rem)] mt-16 fixed  top-0 flex justify-center items-center",
        type === "next" ? "right-0" : "left-0"
      )}
    >
      <Button
        className="data-[hover=true]:bg-zinc-100/hover  text-gray-100 w-5 min-w-5 px-0"
        variant="text"
        onPress={onPress}
      >
        {type === "next" ? (
          <IconIcRoundNavigateNext />
        ) : (
          <IconIcRoundNavigateBefore />
        )}
      </Button>
    </Box>
  )
}

export default memo(function PreviewModal({
  files,
  session,
}: {
  files: FileData[]
  session: Session
}) {
  const modalActions = useModalStore((state) => state.actions)

  const previewFile = useModalStore((state) => state.currentFile)

  const modalOpen = useModalStore((state) => state.open)

  const { id, name, previewType } = previewFile

  const { icon } = useIconData({ id, name, isDir: false })

  const nextItem = useCallback(
    (previewType = "all") => {
      if (files) {
        const nextItem = findNext(files, id, previewType)
        if (nextItem) modalActions.setCurrentFile(nextItem)
      }
    },
    [id, files]
  )

  const prevItem = useCallback(
    (previewType = "all") => {
      if (files) {
        const prevItem = findPrev(files, id, previewType)
        if (prevItem) modalActions.setCurrentFile(prevItem)
      }
    },
    [id, files]
  )

  const handleClose = useCallback(() => modalActions.setOpen(false), [])

  const assetUrl = mediaUrl(id, name, session.hash)

  const renderPreview = useCallback(() => {
    if (previewType) {
      switch (previewType) {
        case preview.video:
          return (
            <Suspense fallback={<Loader />}>
              <VideoPreview name={name} assetUrl={assetUrl} />
            </Suspense>
          )

        case preview.pdf:
          return (
            <WideScreen>
              <PDFPreview assetUrl={assetUrl} />
            </WideScreen>
          )

        case preview.office:
          return (
            <WideScreen>
              <DocPreview assetUrl={assetUrl} />
            </WideScreen>
          )

        case preview.code:
          return (
            <WideScreen>
              <CodePreview name={name} assetUrl={assetUrl} />
            </WideScreen>
          )

        case preview.image:
          return <ImagePreview name={name} assetUrl={assetUrl} />

        case preview.epub:
          return (
            <Suspense fallback={<Loader />}>
              <WideScreen>
                <EpubPreview assetUrl={assetUrl} />
              </WideScreen>
            </Suspense>
          )

        case preview.audio:
          return (
            <AudioPreview
              nextItem={nextItem}
              prevItem={prevItem}
              name={name}
              assetUrl={assetUrl}
            />
          )

        default:
          return null
      }
    }
    return null
  }, [assetUrl, name, previewType])

  return (
    <Modal
      aria-labelledby="preview-modal"
      isOpen={modalOpen}
      size="5xl"
      classNames={{
        wrapper: "overflow-hidden",
        base: "bg-transparent w-full shadow-none",
      }}
      placement="center"
      backdrop="blur"
      onClose={handleClose}
      hideCloseButton
    >
      <ModalContent>
        {id && (
          <>
            <div className="fixed top-0 left-0 h-16 w-full p-3 text-inherit flex justify-between">
              <div className="flex items-center gap-3 w-full">
                <Button
                  variant="text"
                  className="data-[hover=true]:bg-zinc-300/hover dark:data-[hover=true]:bg-zinc-500/hover text-inherit"
                  onPress={handleClose}
                >
                  <IconIcRoundArrowBack className="size-6" />
                </Button>
                <FbIcon icon={icon} className="size-6 min-w-6" />
                <h6
                  className="truncate text-label-large font-normal text-inherit"
                  title={name}
                >
                  {name}
                </h6>
              </div>
            </div>
            <ControlButton type="prev" onPress={() => prevItem()} />
            <ControlButton type="next" onPress={() => nextItem()} />
            <div className="px-8 size-full">{renderPreview()}</div>
          </>
        )}
      </ModalContent>
    </Modal>
  )
})
