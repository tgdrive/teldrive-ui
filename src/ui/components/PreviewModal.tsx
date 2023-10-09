import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { ModalState, SetValue } from "@/ui/types"
import { ChonkyIconFA, ColorsLight, useIconData } from "@bhunter179/chonky"
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
import { useParams } from "react-router-dom"

import { useFetchFiles, useUpdateFile } from "@/ui/hooks/queryhooks"
import { useSession } from "@/ui/hooks/useSession"
import useSettings from "@/ui/hooks/useSettings"
import { getExtension, getMediaUrl, getParams } from "@/ui/utils/common"
import { getPreviewType, preview } from "@/ui/utils/getPreviewType"

import Loader from "./Loader"
import ControlsMenu from "./menus/ControlsMenu"
import OpenWithMenu from "./menus/OpenWithlMenu"
import DocPreview from "./previews/DocPreview"
import FullScreenIFrame from "./previews/FullScreenIFrame"
import ImagePreview from "./previews/ImagePreview"
import PDFPreview from "./previews/PdfPreview"

const VideoPreview = lazy(() => import("./previews/video/VideoPreview"))

const CodePreview = lazy(() => import("./previews/CodePreview"))

const EpubPreview = lazy(() => import("./previews/EpubPreview"))

const AudioPreview = lazy(() => import("./previews/audio/AudioPreview"))

type PreviewModalProps = {
  modalState: Partial<ModalState>
  setModalState: SetValue<Partial<ModalState>>
}

export default memo(function PreviewModal({
  modalState,
  setModalState,
}: PreviewModalProps) {
  const { settings } = useSettings()

  const [initialIndex, setInitialIndex] = useState<number>(-1)

  const params = getParams(useParams())

  const { data } = useFetchFiles(params)

  const { data: session } = useSession()

  const files = useMemo(() => {
    const flatFiles = data?.pages?.flatMap((page) => page?.results ?? [])
    return flatFiles?.filter((item) => {
      const previewType = getPreviewType(getExtension(item.name))
      if (previewType! && previewType! in preview) return true
    })
  }, [data])

  useEffect(
    () =>
      setInitialIndex(files!.findIndex((x) => x.id === modalState.file?.id)),
    []
  )

  const { id, name, starred, mimeType } =
    initialIndex >= 0
      ? files!?.[initialIndex]
      : { id: "", name: "", starred: false, mimeType: "" }

  const { icon, colorCode } = useIconData({ id, name, isDir: false })

  const mediaUrl = getMediaUrl(settings.apiUrl, id, name, session?.hash!)

  const nextItem = useCallback(() => {
    let index = initialIndex + 1
    if (index >= files!?.length) index = 0
    setInitialIndex(index)
  }, [initialIndex])

  const prevItem = useCallback(() => {
    let index = initialIndex - 1
    if (index < 0) index = files!?.length - 1
    setInitialIndex(index)
  }, [initialIndex])

  const handleClose = useCallback(
    () => setModalState((prev) => ({ ...prev, open: false })),
    []
  )

  const { mutation: updateMutation } = useUpdateFile(params)

  const toggleStarred = useCallback(() => {
    updateMutation.mutate({
      id,
      payload: {
        starred: !starred,
      },
    })
  }, [id, starred])

  const previewType = useMemo(
    () =>
      name
        ? getPreviewType(getExtension(name), {
            video: mimeType.includes("video"),
          })
        : "",
    [mimeType, name]
  )
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
            <Suspense fallback={<Loader />}>
              <AudioPreview name={name} mediaUrl={mediaUrl} />
            </Suspense>
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
      }}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: {
            bgcolor: (theme) => alpha(theme.palette.shadow, 0.7),
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
              onClick={prevItem}
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
              onClick={nextItem}
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
