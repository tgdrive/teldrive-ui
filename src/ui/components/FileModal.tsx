import React, { Dispatch, memo, SetStateAction, useCallback } from "react"
import { ModalState, QueryParams } from "@/ui/types"
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

import { useCreateFile, useUpdateFile } from "@/ui/hooks/queryhooks"
import { RenameFile } from "@/ui/utils/chonkyactions"
import { realPath } from "@/ui/utils/common"

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
  modalState: Partial<ModalState>
  setModalState: Dispatch<SetStateAction<Partial<ModalState>>>
  queryParams: Partial<QueryParams>
  path?: string | string[]
}

export default memo(function FileModal({
  modalState,
  setModalState,
  queryParams,
  path,
}: FileModalProps) {
  const handleClose = useCallback(
    () => setModalState((prev) => ({ ...prev, open: false })),
    []
  )

  const { mutation: updateMutation } = useUpdateFile(queryParams)

  const { mutation: createMutation } = useCreateFile(queryParams)

  const { file, open, operation } = modalState

  const onUpdate = useCallback(() => {
    if (operation === RenameFile().id)
      updateMutation.mutate({
        id: file?.id,
        payload: {
          name: file?.name,
          type: file?.type,
        },
      })

    if (operation === ChonkyActions.CreateFolder.id)
      createMutation.mutate({
        payload: {
          name: file?.name,
          type: "folder",
          path: realPath(path as any),
        },
      })

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
          <Typography id="transition-modal-title" variant="h6" component="h2">
            {operation == RenameFile().id && "Rename"}
            {operation == ChonkyActions.CreateFolder.id &&
              ChonkyActions.CreateFolder.button.name}
          </Typography>
          <TextField
            fullWidth
            focused
            value={file?.name}
            variant="outlined"
            inputProps={{ autoComplete: "off" }}
            onChange={(e) =>
              setModalState((prev) => ({
                ...prev,
                file: { ...prev.file, name: e.target.value } as FileData,
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
              disabled={!file?.name}
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
