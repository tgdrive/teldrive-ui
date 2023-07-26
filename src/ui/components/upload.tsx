import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
} from "react"
import { ChonkyIconFA, ColorsLight, useIconData } from "@bhunter179/chonky"
import { CancelOutlined, Visibility } from "@mui/icons-material"
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
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import pLimit from "p-limit"

import useHover from "@/ui/hooks/useHover"
import { realPath, zeroPad } from "@/ui/utils/common"
import http from "@/ui/utils/http"

type UploadFile = {
  name: string
  size: number
  type: string
  progress: number
  status: "idle" | "running" | "complete"
  file: File
}

const modifyFile = (file: File): UploadFile => ({
  name: file.name,
  size: file.size,
  type: file.type,
  progress: 0,
  status: "idle",
  file,
})

const UploadItemEntry = memo(({ name, progress }) => {
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
      {isHovered ? (
        <IconButton sx={{ color: "text.primary" }}>
          <CancelOutlined />
        </IconButton>
      ) : (
        <Box sx={{ height: 40, width: 40, padding: 1 }}>
          <CircularProgress size={24} variant="determinate" value={progress} />
        </Box>
      )}
    </ListItem>
  )
})

enum UploadActionKind {
  SETFILES = "SET_FILES",
  ADDFILES = "ADD_FILES",
  SETINDEX = "SET_INDEX",
  TOGGLECOLLAPSE = "TOGGLE_COLLAPSE",
  SETVISIBILITY = "SET_VISIBILITY",
}

interface UploadAction {
  type: UploadActionKind
  payload?: UploadFile[] | boolean | number
}

interface UploadState {
  files: UploadFile[]
  currIndex: number
  collapse: boolean
  visibility: boolean
}

const uploadState: UploadState = {
  files: [],
  currIndex: 0,
  collapse: true,
  visibility: false,
}

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  const { type, payload } = action
  switch (type) {
    case UploadActionKind.SETFILES:
      return {
        ...state,
        files: payload as UploadFile[],
      }
    case UploadActionKind.ADDFILES:
      return {
        ...state,
        files: [...state.files, ...(payload as UploadFile[])],
      }
    case UploadActionKind.TOGGLECOLLAPSE:
      return {
        ...state,
        collapse: !state.collapse,
      }

    case UploadActionKind.SETVISIBILITY:
      return {
        ...state,
        visibility: payload as boolean,
      }

    case UploadActionKind.SETINDEX:
      return {
        ...state,
        currIndex: payload as number,
      }
    default:
      return state
  }
}

const uploadFile = async (file: UploadFile, path: string[]) => {
  const SPLIT_SIZE = 100 * 1024 * 1024

  const fileParts = Math.ceil(file.size / SPLIT_SIZE)

  const filebuffer = file.file

  const limit = pLimit(8)

  const input = Array(fileParts)
    .fill(0)
    .map((_, index) =>
      limit(() =>
        (async (part: number) => {
          const start = part * SPLIT_SIZE

          const end = Math.min(part * SPLIT_SIZE + SPLIT_SIZE, file.size)

          const fileBlob =
            fileParts > 1 ? filebuffer.slice(start, end) : filebuffer.slice()

          const fileName =
            fileParts > 1
              ? `${file.name}.part.${zeroPad(part + 1, 3)}`
              : file.name

          const headers = { "Content-Type": "application/octet-stream" }

          const response = await fetch(
            `https://gitmedia.bhunter.in/api/releases/upload/109150967?name=${fileName}`,
            {
              method: "post",
              body: fileBlob,
              headers,
            }
          )

          const asset = await response.json()

          return { id: asset.id, size: end - start, part }
        })(index)
      )
    )

  let parts = await Promise.all(input)

  const uploadParts = parts
    .sort((a, b) => a.part - b.part)
    .map((item) => ({ id: item.id, size: item.size }))

  const payload = {
    name: file.name,
    mimeType: file.type,
    type: "file",
    parts: uploadParts,
    size: file.size,
    path: realPath(path),
    userId: "bhunter17",
  }

  console.log(payload)
  //let res = await http.post('/api/files', payload)
}

interface Props {
  path: string[]
}
interface Ref {
  openUpload: () => void
}

const Upload = forwardRef<Ref, Props>(({ path }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, dispatch] = useReducer(uploadReducer, uploadState)

  const { files, currIndex, collapse, visibility } = state

  const openUpload = () => fileInputRef?.current?.click()

  useImperativeHandle(
    ref,
    () => {
      return { openUpload }
    },
    []
  )

  const handleChange = useCallback((event: any) => {
    dispatch({ type: UploadActionKind.SETVISIBILITY, payload: true })
    dispatch({
      type: UploadActionKind.ADDFILES,
      payload: Array.from(event.target.files).map((file) =>
        modifyFile(file as File)
      ),
    })
  }, [])

  const handleCollapse = useCallback(
    () => dispatch({ type: UploadActionKind.TOGGLECOLLAPSE }),
    [dispatch]
  )

  const hideUpload = useCallback(() => {
    dispatch({ type: UploadActionKind.SETVISIBILITY, payload: false })
    dispatch({ type: UploadActionKind.SETFILES, payload: [] })
  }, [dispatch])

  useEffect(() => {
    if (currIndex == 0 && files.length > 0) {
      uploadFile(files[currIndex], path).then((res) => console.log(res))
    }
  }, [files])

  return (
    <>
      <Box
        component={"input"}
        ref={fileInputRef}
        onChange={handleChange}
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
                Uploading 1 file
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
                <UploadItemEntry key={index} {...file} />
              ))}
          </Collapse>
        </List>
      )}
    </>
  )
})

export default Upload
