import React, { useCallback } from "react"
import { FileQueryKey, ModalState, SetValue } from "@/types"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"

import { useDeleteFile } from "@/utils/queryOptions"

type DeleteDialogProps = {
  modalState: Partial<ModalState>
  setModalState: SetValue<ModalState>
  queryKey: FileQueryKey
}

export default function DeleteDialog({
  modalState,
  setModalState,
  queryKey,
}: DeleteDialogProps) {
  const deleteMutation = useDeleteFile(queryKey)

  const handleClose = useCallback((denyDelete = true) => {
    if (!denyDelete) {
      deleteMutation.mutate({ files: modalState.selectedFiles })
      setModalState((prev) => ({ ...prev, open: false, successful: true }))
    } else {
      setModalState((prev) => ({ ...prev, open: false }))
    }
  }, [])

  return (
    <Dialog
      open={modalState.open!}
      onClose={() => handleClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{ elevation: 0 }}
    >
      <DialogTitle id="alert-dialog-title">{"Delete Files"}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Do you want to remove selected files?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose()}>No</Button>
        <Button onClick={() => handleClose(false)} autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  )
}
