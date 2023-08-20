import React, { Dispatch, SetStateAction, useCallback, useMemo } from "react"
import { ModalState, QueryParams } from "@/ui/types"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"

import { useDeleteFile } from "@/ui/hooks/queryhooks"

type DeleteDialogProps = {
  modalState: Partial<ModalState>
  setModalState: Dispatch<SetStateAction<Partial<ModalState>>>
  queryParams: Partial<QueryParams>
}
export default function DeleteDialog({
  modalState,
  setModalState,
  queryParams,
}: DeleteDialogProps) {
  const { mutation: deleteMutation } = useDeleteFile(queryParams)

  const handleClose = useCallback((denyDelete = true) => {
    if (!denyDelete) {
      deleteMutation.mutate({ files: modalState.selectedFiles });
      setModalState((prev) => ({ ...prev, open: false, successful: true, }))
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
