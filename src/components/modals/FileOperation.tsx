import React, { memo, useCallback } from "react"
import { FileQueryKey, ModalState, QueryParams, SetValue } from "@/types"
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

import { useCreateFile, useUpdateFile } from "@/utils/queryOptions"

const StyledPaper = styled(Paper)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  padding: 24,
  "@media (max-width: 480px)": {
    width: 300,
  },
})

type FileModalProps = {
  modalState: ModalState
  setModalState: SetValue<ModalState>
  queryKey: FileQueryKey
}

export default memo(function FileModal({
  modalState,
  setModalState,
  queryKey,
}: FileModalProps) {
  const handleClose = useCallback(
    () => setModalState((prev) => ({ ...prev, open: false })),
    []
  )

  const updateMutation = useUpdateFile(queryKey)

  const createMutation = useCreateFile(queryKey)

  const { currentFile, open, operation } = modalState

  const onUpdate = useCallback(() => {
    if (operation === "rename_file")
      updateMutation.mutate({
        id: currentFile?.id,
        payload: {
          name: currentFile?.name,
          type: currentFile?.type,
        },
      })

    if (operation === ChonkyActions.CreateFolder.id)
      createMutation.mutate({
        payload: {
          name: currentFile?.name,
          type: "folder",
          path: (queryKey[1] as QueryParams).path || "/",
        },
      })

    handleClose()
  }, [currentFile, operation, updateMutation, handleClose, createMutation])

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
          <Typography id="transition-modal-title" variant="h6" component="h2">
            {operation === "rename_file" && "Rename"}
            {operation === ChonkyActions.CreateFolder.id &&
              ChonkyActions.CreateFolder.button.name}
          </Typography>
          <TextField
            fullWidth
            focused
            value={currentFile?.name}
            variant="outlined"
            inputProps={{ autoComplete: "off" }}
            onChange={(e) =>
              setModalState((prev) => ({
                ...prev,
                currentFile: {
                  ...prev.currentFile,
                  name: e.target.value,
                } as FileData,
              }))
            }
          />
          <Box
            sx={{
              display: "inline-flex",
              justifyContent: "flex-end",
              gap: "1.2rem",
            }}
          >
            <Button
              sx={{ fontWeight: "normal" }}
              variant="text"
              onClick={handleClose}
              disableElevation
            >
              Cancel
            </Button>
            <Button
              disabled={!currentFile?.name}
              sx={{ fontWeight: "normal" }}
              variant="contained"
              onClick={onUpdate}
              disableElevation
            >
              OK
            </Button>
          </Box>
        </StyledPaper>
      </Fade>
    </Modal>
  )
})
