import React, { memo, useCallback, useEffect, useReducer, useRef } from "react"
import { File as FileRes, QueryParams, UploadPart } from "@/ui/types"
import { ChonkyIconFA, ColorsLight, useIconData } from "@bhunter179/chonky"
import {
  Cancel,
  CancelOutlined,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material"
import CloseIcon from "@mui/icons-material/Close"
import ExpandLess from "@mui/icons-material/ExpandLess"
import ExpandMore from "@mui/icons-material/ExpandMore"
import { Box, darken, lighten, Paper, Typography } from "@mui/material"
import CircularProgress from "@mui/material/CircularProgress"
import Collapse from "@mui/material/Collapse"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import ListSubheader from "@mui/material/ListSubheader"
import pLimit from "p-limit"

import { useCreateFile } from "@/ui/hooks/queryhooks"
import useHover from "@/ui/hooks/useHover"
import { realPath, zeroPad } from "@/ui/utils/common"
import { sha1 } from "@/ui/utils/crypto"
import http from "@/ui/utils/http"

enum FileUploadStatus {
  NOT_STARTED,
  UPLOADING,
  UPLOADED,
  CANCELLED,
  FAILED,
}

interface FileUploadState {
  files: File[]
  currentFileIndex: number
  uploadProgress: number
  collapse: boolean
  visibility: boolean
  fileUploadStates: FileUploadStatus[]
  fileAbortControllers: AbortController[]
}

enum ActionTypes {
  SET_FILES = "SET_FILES",
  ADD_FILES = "ADD_FILES",
  SET_FILE_UPLOAD_STATUS = "SET_FILE_UPLOAD_STATUS",
  SET_UPLOAD_PROGRESS = "SET_UPLOAD_PROGRESS",
  SET_CURRENT_FILE_INDEX = "SET_CURRENT_FILE_INDEX",
  SET_UPLOAD_CANCELLED = "SET_UPLOAD_CANCELLED",
  TOGGLE_COLLAPSE = "TOGGLE_COLLAPSE",
  SET_VISIBILITY = "SET_VISIBILITY",
  SET_UPLOAD_STATE = "SET_UPLOAD_STATE",
}

type Action =
  | { type: ActionTypes.SET_FILES; payload: File[] }
  | { type: ActionTypes.ADD_FILES; payload: File[] }
  | {
      type: ActionTypes.SET_FILE_UPLOAD_STATUS
      payload: { fileIndex: number; status: FileUploadStatus }
    }
  | { type: ActionTypes.SET_UPLOAD_PROGRESS; payload: number }
  | { type: ActionTypes.SET_CURRENT_FILE_INDEX; payload: number }
  | { type: ActionTypes.TOGGLE_COLLAPSE }
  | { type: ActionTypes.SET_VISIBILITY; payload: boolean }

const initialState: FileUploadState = {
  files: [],
  currentFileIndex: 0,
  uploadProgress: 0,
  collapse: true,
  visibility: false,
  fileUploadStates: [],
  fileAbortControllers: [],
}

const reducer = (state: FileUploadState, action: Action): FileUploadState => {
  switch (action.type) {
    case ActionTypes.SET_FILES:
      return {
        ...state,
        files: action.payload,
        fileUploadStates: action.payload.map(
          () => FileUploadStatus.NOT_STARTED
        ),
        fileAbortControllers: action.payload.map(() => new AbortController()),
      }
    case ActionTypes.ADD_FILES:
      const fileUploadStates = action.payload.map(
        () => FileUploadStatus.NOT_STARTED
      )
      const fileAbortControllers = action.payload.map(
        () => new AbortController()
      )
      return {
        ...state,
        files: [...state.files, ...action.payload],
        fileUploadStates: [...state.fileUploadStates, ...fileUploadStates],
        fileAbortControllers: [
          ...state.fileAbortControllers,
          ...fileAbortControllers,
        ],
      }
    case ActionTypes.SET_UPLOAD_PROGRESS:
      return { ...state, uploadProgress: action.payload }
    case ActionTypes.SET_CURRENT_FILE_INDEX:
      return { ...state, currentFileIndex: action.payload }
    case ActionTypes.TOGGLE_COLLAPSE:
      return { ...state, collapse: !state.collapse }
    case ActionTypes.SET_VISIBILITY:
      return { ...state, visibility: action.payload }
    case ActionTypes.SET_FILE_UPLOAD_STATUS:
      const newFileUploadStates = [...state.fileUploadStates]
      newFileUploadStates[action.payload.fileIndex] = action.payload.status
      return {
        ...state,
        fileUploadStates: newFileUploadStates,
      }
    default:
      return state
  }
}

type UploadEntryProps = {
  index: number
  name: string
  progress: number
  uploadState: FileUploadStatus
  handleCancel: (index: number) => void
}

const UploadItemEntry = memo(
  ({ index, name, progress, uploadState, handleCancel }: UploadEntryProps) => {
    const { icon, colorCode } = useIconData({ name, isDir: false, id: "" })

    const [hoverRef, isHovered] = useHover()

    return (
      <ListItem ref={hoverRef}>
        <ListItemIcon>
          <ChonkyIconFA icon={icon} style={{ color: ColorsLight[colorCode] }} />
        </ListItemIcon>
        <ListItemText
          title={name}
          primaryTypographyProps={{
            sx: {
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            },
          }}
          primary={name}
        />
        {isHovered && uploadState === FileUploadStatus.UPLOADING ? (
          <IconButton
            sx={{ color: "text.primary" }}
            onClick={() => handleCancel(index)}
          >
            <CancelOutlined />
          </IconButton>
        ) : (
          <Box sx={{ height: 40, width: 40 }}>
            {uploadState === FileUploadStatus.UPLOADING && (
              <Box sx={{ height: 40, width: 40, padding: 1 }}>
                <CircularProgress
                  size={24}
                  variant="determinate"
                  value={progress}
                />
              </Box>
            )}
            {uploadState === FileUploadStatus.UPLOADED && (
              <IconButton sx={{ color: "green" }}>
                <CheckCircleOutline />
              </IconButton>
            )}
            {uploadState === FileUploadStatus.FAILED && (
              <IconButton sx={{ color: "red" }}>
                <ErrorOutline />
              </IconButton>
            )}
            {uploadState === FileUploadStatus.CANCELLED && (
              <IconButton sx={{ color: "gray" }}>
                <Cancel />
              </IconButton>
            )}
          </Box>
        )}
      </ListItem>
    )
  }
)

interface UploadProps {
  path: string[]
  hideUpload: () => void
  fileDialogOpened: boolean
  closeFileDialog: () => void
  queryParams: Partial<QueryParams>
}

const uploadPart = async <T extends {}>(
  url: string,
  body: Blob,
  params: Record<string, string>,
  onProgress: (progress: number) => void,
  cancelSignal: AbortSignal
) => {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    cancelSignal.addEventListener("abort", () => {
      xhr.abort()
      reject(new Error("File upload cancelled"))
    })
    xhr.upload.onprogress = (event) => {
      const partProgress = (event.loaded / event.total) * 100
      onProgress(partProgress)
    }
    xhr.onload = () => {
      if (xhr.status == 200) {
        onProgress(100)
        resolve(JSON.parse(xhr.responseText))
      } else reject(new Error("File upload failed"))
    }

    xhr.onerror = () => {
      reject(new Error("File upload failed"))
    }
    const target = new URL(url)
    target.search = new URLSearchParams(params).toString()
    xhr.open("POST", target, true)
    xhr.withCredentials = true
    xhr.setRequestHeader("Content-Type", "application/octet-stream")
    xhr.send(body)
  })
}

const uploadFile = async (
  file: File,
  path: string,
  onProgress: (progress: number) => void,
  cancelSignal: AbortSignal
) => {
  const SPLIT_SIZE = 1024 * 1024 * 1024

  const totalParts = Math.ceil(file.size / SPLIT_SIZE)

  const limit = pLimit(4)

  const uploadId = await sha1(file.size.toString() + file.name + path)

  const url = `${
    process.env.NEXT_PUBLIC_API_HOST ?? window.location.origin
  }/api/uploads/${uploadId}`

  let partProgress: number[] = []

  const partUploadPromises: Promise<UploadPart>[] = []

  const partCancelSignals: AbortController[] = []

  for (let partIndex = 0; partIndex < totalParts; partIndex++) {
    const controller = new AbortController()

    partCancelSignals.push(controller)

    partUploadPromises.push(
      limit(() =>
        (async () => {
          const start = partIndex * SPLIT_SIZE

          const end = Math.min(partIndex * SPLIT_SIZE + SPLIT_SIZE, file.size)

          const fileBlob = totalParts > 1 ? file.slice(start, end) : file

          const fileName =
            totalParts > 1
              ? `${file.name}.part.${zeroPad(partIndex + 1, 3)}`
              : file.name

          const params: Record<string, string> = {
            fileName,
            partNo: (partIndex + 1).toString(),
            totalparts: totalParts.toString(),
          }

          const asset = await uploadPart<UploadPart>(
            url,
            fileBlob,
            params,
            (progress) => {
              partProgress[partIndex] = progress
            },
            controller.signal
          )

          return asset
        })()
      )
    )
  }

  cancelSignal.addEventListener("abort", () => {
    partCancelSignals.forEach((controller) => {
      controller.abort()
    })
  })

  const timer = setInterval(() => {
    const totalProgress = partProgress.reduce(
      (sum, progress) => sum + progress,
      0
    )
    onProgress(totalProgress / totalParts)
  }, 3000)
  try {
    const parts = await Promise.all(partUploadPromises)
    const uploadParts = parts
      .sort((a, b) => a.partNo - b.partNo)
      .map((item) => ({ id: item.partId }))

    const payload = {
      name: file.name,
      mimeType: file.type,
      type: "file",
      parts: uploadParts,
      size: file.size,
      path,
    }

    const res = await http.post("api/files", { json: payload }).json<FileRes>()

    if (res.id) await http.delete(`api/uploads/${uploadId}`)
    return res
  } catch (error) {
  } finally {
    clearInterval(timer)
  }
}

const Upload = ({
  path,
  hideUpload,
  fileDialogOpened,
  closeFileDialog,
  queryParams,
}: UploadProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    files,
    currentFileIndex,
    uploadProgress,
    collapse,
    visibility,
    fileUploadStates,
    fileAbortControllers,
  } = state

  const previndex = useRef(-1)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFileSelector = useCallback(() => {
    fileInputRef?.current?.click()
    window.addEventListener(
      "focus",
      () => {
        if (fileInputRef.current?.files?.length == 0) closeFileDialog()
      },
      { once: true }
    )
  }, [])

  const handleCollapse = useCallback(
    () => dispatch({ type: ActionTypes.TOGGLE_COLLAPSE }),
    [dispatch]
  )

  const handleCancel = useCallback(
    (index: number) => {
      dispatch({
        type: ActionTypes.SET_FILE_UPLOAD_STATUS,
        payload: {
          fileIndex: index,
          status: FileUploadStatus.CANCELLED,
        },
      })
      fileAbortControllers[index].abort()
    },
    [fileAbortControllers]
  )

  useEffect(() => {
    if (fileDialogOpened) openFileSelector()
  }, [fileDialogOpened])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files
      if (selectedFiles) {
        dispatch({ type: ActionTypes.SET_VISIBILITY, payload: true })
        dispatch({
          type: ActionTypes.ADD_FILES,
          payload: Array.from(selectedFiles),
        })
        closeFileDialog()
      }
    },
    []
  )
  useEffect(() => {
    if (
      fileUploadStates[currentFileIndex] == FileUploadStatus.CANCELLED &&
      currentFileIndex < files.length
    ) {
      dispatch({
        type: ActionTypes.SET_CURRENT_FILE_INDEX,
        payload: currentFileIndex + 1,
      })
    }
  }, [fileUploadStates])

  useEffect(() => {
    if (files.length > 0 && currentFileIndex < files.length) {
      if (previndex.current !== currentFileIndex) {
        dispatch({
          type: ActionTypes.SET_FILE_UPLOAD_STATUS,
          payload: {
            fileIndex: currentFileIndex,
            status: FileUploadStatus.UPLOADING,
          },
        })
        uploadFile(
          files[currentFileIndex],
          realPath(path),
          (progress) => {
            dispatch({
              type: ActionTypes.SET_UPLOAD_PROGRESS,
              payload: progress,
            })
          },
          fileAbortControllers[currentFileIndex].signal
        ).then((file) => {
          dispatch({ type: ActionTypes.SET_UPLOAD_PROGRESS, payload: 100 })
          dispatch({
            type: ActionTypes.SET_FILE_UPLOAD_STATUS,
            payload: {
              fileIndex: currentFileIndex,
              status: FileUploadStatus.UPLOADED,
            },
          })
          dispatch({
            type: ActionTypes.SET_CURRENT_FILE_INDEX,
            payload: currentFileIndex + 1,
          })
          fileAbortControllers[currentFileIndex].abort()
        })
        previndex.current = currentFileIndex
      }
    }
  }, [files, currentFileIndex])

  return (
    <>
      <Box
        component={"input"}
        ref={fileInputRef}
        onChange={handleFileChange}
        type="file"
        sx={{ display: "none" }}
        multiple
      />
      {visibility && (
        <List
          sx={{
            width: "100%",
            maxWidth: 360,
            position: "fixed",
            bottom: 0,
            right: 8,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            "@media (max-width: 1024px)": {
              bottom: 56,
            },
            background: (theme) =>
              theme.palette.mode === "dark"
                ? lighten(theme.palette.background.paper, 0.08)
                : darken(theme.palette.background.paper, 0.02),
          }}
          component={Paper}
          subheader={
            <ListSubheader
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" component="h6">
                {`Uploading ${files.length} file`}
              </Typography>
              <Box>
                <IconButton
                  sx={{ color: "text.primary" }}
                  onClick={handleCollapse}
                >
                  {collapse ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                <IconButton sx={{ color: "text.primary" }} onClick={hideUpload}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </ListSubheader>
          }
        >
          <Collapse
            in={collapse}
            timeout="auto"
            unmountOnExit
            sx={{ maxHeight: 200, overflow: "auto" }}
          >
            {files.length > 0 &&
              files.map((file, index) => (
                <UploadItemEntry
                  index={index}
                  key={index}
                  name={file.name}
                  uploadState={fileUploadStates[index]}
                  handleCancel={handleCancel}
                  progress={index === currentFileIndex ? uploadProgress : 0}
                />
              ))}
          </Collapse>
        </List>
      )}
    </>
  )
}

export default Upload
