import React from "react"
import { Settings } from "@/ui/types"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

import useSettings from "@/ui/hooks/useSettings"
import { splitFileSizes } from "@/ui/utils/common"

type SettingsProps = {
  open: boolean
  onClose: () => void
}

function SettingsDialog({ open, onClose }: SettingsProps) {
  const { settings, setSettings } = useSettings()

  const { control, handleSubmit } = useForm<Settings>({
    defaultValues: settings,
  })

  const onSubmit: SubmitHandler<Settings> = (data) => {
    setSettings(data)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { boxShadow: "none", width: 400 } }}
    >
      <DialogTitle>Settings</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <Controller
          name="apiUrl"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              fullWidth
              error={!!error}
              type="text"
              label="API URL"
              helperText={error ? error.message : ""}
            />
          )}
        />
        <Controller
          name="uploadConcurrency"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              fullWidth
              error={!!error}
              type="text"
              label="Concurrent Part Uploads"
              helperText={error ? error.message : ""}
            />
          )}
        />
        <Controller
          name="splitFileSize"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Split File Size"
              fullWidth
              margin="normal"
              helperText={error ? error.message : ""}
            >
              {splitFileSizes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit(onSubmit)}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SettingsDialog
