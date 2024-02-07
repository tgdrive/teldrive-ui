import React, { lazy, memo, Suspense, useCallback, useState } from "react"
import { FileQueryKey, ModalState, SetValue } from "@/types"
import {
  ChonkyIconFA,
  ColorsLight,
  FileData,
  useIconData,
} from "@bhunter179/chonky"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined"
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore"
import NavigateNextIcon from "@mui/icons-material/NavigateNext"
import { alpha } from "@mui/material"
import Backdrop from "@mui/material/Backdrop"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Modal from "@mui/material/Modal"
import Typography from "@mui/material/Typography"

import { useSession } from "@/hooks/useSession"
import Loader from "@/components/Loader"
import ControlsMenu from "@/components/menus/Controls"
import OpenWithMenu from "@/components/menus/OpenWith"
import AudioPreview from "@/components/previews/audio/AudioPreview"
import DocPreview from "@/components/previews/DocPreview"
import FullScreenIFrame from "@/components/previews/FullScreenIFrame"
import ImagePreview from "@/components/previews/ImagePreview"
import PDFPreview from "@/components/previews/PdfPreview"
import { getMediaUrl } from "@/utils/common"
import { preview } from "@/utils/getPreviewType"
import { useUpdateFile } from "@/utils/queryOptions"

const VideoPreview = lazy(
  () => import("@/components/previews/video/VideoPreview")
)

const CodePreview = lazy(() => import("@/components/previews/CodePreview"))

const EpubPreview = lazy(() => import("@/components/previews/EpubPreview"))

type PreviewModalProps = {
  files: FileData[]
  modalState: Partial<ModalState>
  setModalState: SetValue<ModalState>
  queryKey: FileQueryKey
}
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
}

export default memo(function PreviewModal({
  files,
  modalState,
  setModalState,
  queryKey,
}: PreviewModalProps) {
  const { data: session } = useSession()

  const [previewFile, setPreviewFile] = useState(modalState.currentFile!)

  const { id, name, previewType, starred } = previewFile

  const { icon, colorCode } = useIconData({ id, name, isDir: false })

  const nextItem = useCallback(
    (previewType = "all") => {
      if (files) {
        const nextItem = findNext(files, id, previewType)
        if (nextItem) setPreviewFile(nextItem)
      }
    },
    [id, files]
  )

  const prevItem = useCallback(
    (previewType = "all") => {
      if (files) {
        const prevItem = findPrev(files, id, previewType)
        if (prevItem) setPreviewFile(prevItem)
      }
    },
    [id, files]
  )

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, open: false }))
  }, [])

  const mediaUrl = getMediaUrl(id, name, session?.hash!)

  const updateMutation = useUpdateFile(queryKey)

  const toggleStarred = useCallback(() => {
    updateMutation.mutate({
      id,
      payload: {
        starred: !starred,
      },
    })
  }, [id, starred, updateMutation])

  const renderPreview = useCallback(() => {
    if (previewType) {
      switch (previewType) {
        case preview.video:
          return (
            <Suspense fallback={<Loader />}>
              <VideoPreview name={name} mediaUrl={mediaUrl} />
            </Suspense>
          )

        case preview.pdf:
          return (
            <FullScreenIFrame>
              <PDFPreview mediaUrl={mediaUrl} />
            </FullScreenIFrame>
          )

        case preview.office:
          return (
            <FullScreenIFrame>
              <DocPreview mediaUrl={mediaUrl} />
            </FullScreenIFrame>
          )

        case preview.code:
          return (
            <Suspense fallback={<Loader />}>
              <FullScreenIFrame>
                <CodePreview name={name} mediaUrl={mediaUrl} />
              </FullScreenIFrame>
            </Suspense>
          )

        case preview.image:
          return <ImagePreview name={name} mediaUrl={mediaUrl} />

        case preview.epub:
          return (
            <Suspense fallback={<Loader />}>
              <FullScreenIFrame>
                <EpubPreview mediaUrl={mediaUrl} />
              </FullScreenIFrame>
            </Suspense>
          )

        case preview.audio:
          return (
            <AudioPreview
              nextItem={nextItem}
              prevItem={prevItem}
              name={name}
              mediaUrl={mediaUrl}
            />
          )

        default:
          return null
      }
    }
  }, [mediaUrl, name, previewType])

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={modalState.open as boolean}
      sx={{
        display: "flex",
        overflowY: "auto",
        flexDirection: "column",
        gap: "3rem",
        overflow: "hidden",
      }}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: {
            bgcolor: (theme) => alpha(theme.palette.shadow.main, 0.7),
          },
        },
      }}
    >
      <>
        {id && name && (
          <>
            <IconButton
              sx={{
                position: "absolute",
                left: 32,
                color: "white",
                top: "50%",
                background: "#1F1F1F",
              }}
              color="inherit"
              edge="start"
              onClick={() => prevItem()}
            >
              <NavigateBeforeIcon />
            </IconButton>

            <IconButton
              sx={{
                position: "absolute",
                right: 32,
                color: "white",
                top: "50%",
                background: "#1F1F1F",
              }}
              color="inherit"
              edge="start"
              onClick={() => nextItem()}
            >
              <NavigateNextIcon />
            </IconButton>

            <Box
              sx={{
                position: "absolute",
                height: 64,
                width: "100%",
                top: 0,
                padding: 2,
                color: "white",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "30%",
                  position: "absolute",
                  left: "1rem",
                }}
              >
                <IconButton color="inherit" edge="start" onClick={handleClose}>
                  <ArrowBackIcon />
                </IconButton>
                <ChonkyIconFA
                  icon={icon}
                  style={{ color: ColorsLight[colorCode] }}
                />
                <Typography
                  sx={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                  variant="h6"
                  component="h6"
                  title={name}
                >
                  {name}
                </Typography>
              </Box>
              {previewType === preview.video && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginRight: "-50%",
                    transform: "translate(-50%,-50%)",
                  }}
                >
                  <OpenWithMenu
                    videoUrl={`${mediaUrl}`}
                    previewType={previewType!}
                  />
                </Box>
              )}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  position: "absolute",
                  right: "1rem",
                }}
              >
                <IconButton
                  component={"a"}
                  rel="noopener noreferrer"
                  href={`${mediaUrl}&d=1`}
                  color="inherit"
                  edge="start"
                >
                  <FileDownloadOutlinedIcon />
                </IconButton>
                <ControlsMenu starred={starred} toggleStarred={toggleStarred} />
              </Box>
            </Box>

            {renderPreview()}
          </>
        )}
      </>
    </Modal>
  )
})
