import React, {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { ModalState, QueryParams } from "@/ui/types"
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

import { useFetchFiles, useUpdateFile } from "@/ui/hooks/queryhooks"
import useSettings from "@/ui/hooks/useSettings"
import { getExtension, getMediaUrl } from "@/ui/utils/common"
import { getPreviewType, preview } from "@/ui/utils/getPreviewType"

import ControlsMenu from "./menus/ControlsMenu"
import OpenWithMenu from "./menus/OpenWithlMenu"
import CodePreview from "./previews/CodePreview"
import EpubPreview from "./previews/EpubPreview"
import ImagePreview from "./previews/ImagePreview"
import PDFPreview from "./previews/PdfPreview"
import VideoPreview from "./previews/VideoPreview"

type PreviewModalProps = {
  queryParams: Partial<QueryParams>
  modalState: Partial<ModalState>
  setModalState: Dispatch<SetStateAction<Partial<ModalState>>>
}

export default memo(function PreviewModal({
  queryParams,
  modalState,
  setModalState,
}: PreviewModalProps) {
  const { settings } = useSettings()

  const [initialIndex, setInitialIndex] = useState<number>(-1)

  const [params] = useState<Partial<QueryParams>>(queryParams)

  const { data } = useFetchFiles(params)

  const files = useMemo(
    () => data?.pages?.flatMap((page) => page?.results ?? []),
    [data]
  )

  useEffect(
    () =>
      setInitialIndex(files!.findIndex((x) => x.id === modalState.file?.id)),
    []
  )

  const { id, name, starred } =
    initialIndex >= 0
      ? files!?.[initialIndex]
      : { id: "", name: "", starred: "" }

  const { icon, colorCode } = useIconData({ id, name, isDir: false })

  const mediaUrl = getMediaUrl(settings.apiUrl, id, name)

  const nextItem = useCallback(() => {
    let index = initialIndex + 1
    if (index >= files!?.length) index = 0
    setInitialIndex(index)
  }, [initialIndex])

  const prevItem = useCallback(() => {
    let index = initialIndex - 1
    if (index < 0) index = 0
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
    () => (name ? getPreviewType(getExtension(name)) : ""),
    [name]
  )

  const renderPreview = useCallback(() => {
    if (previewType) {
      switch (previewType) {
        case preview.video:
          return <VideoPreview name={name} mediaUrl={mediaUrl} />

        case preview.pdf:
          return <PDFPreview mediaUrl={mediaUrl} />

        case preview.code:
          return <CodePreview name={name} mediaUrl={mediaUrl} />

        case preview.image:
          return <ImagePreview name={name} mediaUrl={mediaUrl} />

        case preview.epub:
          return <EpubPreview mediaUrl={mediaUrl} />

        default:
          return null
      }
    }
  }, [id, name])

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
                zIndex: 100,
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
                zIndex: 100,
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
                  videoUrl={`${mediaUrl}?d=1`}
                  previewType={previewType}
                />
              </Box>
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
                  component={Link}
                  rel="noopener noreferrer"
                  href={`${mediaUrl}?d=1`}
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
