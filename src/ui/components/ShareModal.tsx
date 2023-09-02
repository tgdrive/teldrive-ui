import React, {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { FileVisibility, ModalState, QueryParams, Settings } from "@/ui/types"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import { Autocomplete } from "@mui/material"
import Backdrop from "@mui/material/Backdrop"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Fade from "@mui/material/Fade"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormGroup from "@mui/material/FormGroup"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Modal from "@mui/material/Modal"
import Paper from "@mui/material/Paper"
import Switch from "@mui/material/Switch"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/system"

import { useShareFile, useUpdateFile } from "@/ui/hooks/queryhooks"
import { getShareableUrl, realPath } from "@/ui/utils/common"

import SwitchLoader from "./SwitchLoader"

const StyledPaper = styled(Paper)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "calc(100% - 80px)",
  maxWidth: 700,
  margin: "0 40px 0 0",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "2rem",
  padding: 24,
  "@media (max-width: 480px)": {
    width: 300,
  },
})

type FileModalProps = {
  modalState: Partial<ModalState>
  setModalState: Dispatch<SetStateAction<Partial<ModalState>>>
  queryParams: Partial<QueryParams>
}

export default memo(function ShareModal({
  modalState,
  setModalState,
  queryParams,
}: FileModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { mutation: shareMutation } = useShareFile(queryParams)

  const { open, file } = modalState
  const [isSharingEnabled, setIsSharingEnabled] = useState(
    file?.visibility === "public"
  )

  const handleUsernamesChange = (
    _: React.SyntheticEvent<Element, Event>,
    value: string[]
  ) => {
    enableFileSharing(value.length === 0 ? "private" : "limited", value)
  }

  const handleFileSharingState = () => {
    if (file?.visibility === "public") {
      setIsSharingEnabled(false)
      setIsLoading(true)
      disableFileSharing()
      setIsLoading(false)
    } else {
      setIsSharingEnabled(true)
      setIsLoading(true)
      enableFileSharing("public")
      setIsLoading(false)
    }
  }

  const handleCopyClick = () => {
    if (inputRef.current) {
      inputRef.current.select()
      navigator.clipboard.writeText(inputRef.current.value)
    }
  }

  const handleClose = useCallback(
    () => setModalState((prev) => ({ ...prev, open: false })),
    []
  )

  const disableFileSharing = useCallback(() => {
    if (file?.visibility === "public") {
      shareMutation.mutate({
        id: file?.id,
        payload: {
          visibility:
            (file.sharedWithUsernames?.length || 0) > 0 ? "limited" : "private",
          sharedWithUsername: file.sharedWithUsernames,
        },
      })
    }
  }, [file?.visibility, file?.sharedWithUsernames, shareMutation])

  const enableFileSharing = useCallback(
    (
      visibility: FileVisibility,
      sharedWithUsername: string[] = file?.sharedWithUsernames || []
    ) => {
      shareMutation.mutate({
        id: file?.id,
        payload: {
          visibility,
          sharedWithUsername,
        },
      })
    },
    [file?.visibility, file?.sharedWithUsernames, shareMutation]
  )

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={!!open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={open}>
        <StyledPaper elevation={3}>
          <Box sx={{ width: 1 }}>
            <Typography
              className="transition-modal-title"
              variant="h6"
              component="h2"
              fontWeight={600}
              sx={{ mb: 2 }}
            >
              Share: {file?.name}
            </Typography>
            <Divider flexItem role="presentation" />
          </Box>
          <FormGroup>
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <SwitchLoader
                  checked={isSharingEnabled}
                  onChange={handleFileSharingState}
                  loading={isLoading}
                />
              }
              label="Make public:"
              labelPlacement="start"
            />
          </FormGroup>
          {file?.visibility !== "public" && (
            <Autocomplete
              multiple
              fullWidth
              id="tags-outlined"
              options={[] as string[]}
              getOptionLabel={(option) => option}
              defaultValue={[]}
              value={file?.sharedWithUsernames || []}
              filterSelectedOptions
              freeSolo
              onChange={handleUsernamesChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add user"
                  placeholder="telegram username"
                />
              )}
            />
          )}
          {(file?.visibility === "public" ||
            file?.visibility === "limited") && (
            <TextField
              fullWidth
              focused
              inputRef={inputRef}
              label="Share URL"
              value={getShareableUrl(file?.id || "")}
              variant="outlined"
              inputProps={{ autoComplete: "off" }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyClick}>
                      <ContentCopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          <Box
            sx={{
              width: 1,
              display: "inline-flex",
              justifyContent: "flex-end",
              gap: "1.2rem",
            }}
          >
            <Button
              disabled={!file?.name}
              sx={{ fontWeight: "normal" }}
              variant="contained"
              onClick={handleClose}
              disableElevation
            >
              Cerrar
            </Button>
          </Box>
        </StyledPaper>
      </Fade>
    </Modal>
  )
})
