import React, { Dispatch, memo, SetStateAction, useCallback, useRef, useState } from "react"
import { ModalState, QueryParams, Settings } from "@/ui/types"
import { ChonkyActions, FileData } from "@bhunter179/chonky"
import Backdrop from "@mui/material/Backdrop"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Fade from "@mui/material/Fade"
import Modal from "@mui/material/Modal"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/system"

import InputAdornment from "@mui/material/InputAdornment";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import Divider from '@mui/material/Divider';

import { useCreateFile, useUpdateFile } from "@/ui/hooks/queryhooks"
import { ShareFile } from "@/ui/utils/chonkyactions"
import { getShareableUrl, realPath } from "@/ui/utils/common"

const StyledPaper = styled(Paper)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 700,
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
  path?: string | string[]
}

export default memo(function ShareModal({
  modalState,
  setModalState,
  queryParams,
  path,
}: FileModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isShareEnabled, setIsShareEnabled] = useState(false)

  const handleSwitchChange = () => {
    console.log("Changed")
    if (isShareEnabled) {
      setIsShareEnabled(false)
    } else {
      setIsShareEnabled(true)
    }
  }

  const handleCopyClick = () => {
    if (inputRef.current) {
      inputRef.current.select();
      document.execCommand("copy");
    }
  };

  const handleClose = useCallback(
    () => setModalState((prev) => ({ ...prev, open: false })),
    []
  )

  const { mutation: updateMutation } = useUpdateFile(queryParams)

  const { mutation: createMutation } = useCreateFile(queryParams)

  const { file, open, operation } = modalState

  const onUpdate = useCallback(() => {
    handleClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, operation, updateMutation, handleClose, createMutation])

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
            <Typography className="transition-modal-title" variant="h6" component="h2" fontWeight={600} sx={{ mb: 2 }}>
              Share: {file?.name}
            </Typography>
            <Divider flexItem role="presentation" />
          </Box>
          <FormGroup >
            <FormControlLabel sx={{m:0}} control={<Switch checked={isShareEnabled} onChange={handleSwitchChange} />} label="Make public" labelPlacement="start" />
          </FormGroup>
          {isShareEnabled && <TextField
            fullWidth
            focused
            inputRef={inputRef}
            label="Share URL"
            value={getShareableUrl(file?.id || "")}
            variant="outlined"
            inputProps={{ autoComplete: "off" }}
            InputProps={{endAdornment:<InputAdornment position="end">
              <IconButton onClick={handleCopyClick}>
                <ContentCopyIcon />
              </IconButton>
            </InputAdornment>}}
          />}
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
              onClick={onUpdate}
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
