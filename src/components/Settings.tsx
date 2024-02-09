import React, { memo, useCallback, useEffect, useState } from "react"
import { AccountStats, Channel, Message, Settings } from "@/types"
import { defaultFormatters, FileData } from "@bhunter179/chonky"
import { SmartToy } from "@mui/icons-material"
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices"
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline"
import StorageIcon from "@mui/icons-material/Storage"
import TabContext from "@mui/lab/TabContext"
import TabList from "@mui/lab/TabList"
import TabPanel from "@mui/lab/TabPanel"
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  LinearProgress,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import Tab from "@mui/material/Tab"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Control, Controller, SubmitHandler, useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { useIntl } from "react-intl"
import { useBoolean } from "usehooks-ts"

import { useSession } from "@/hooks/useSession"
import useSettings from "@/hooks/useSettings"
import { copyDataToClipboard, splitFileSizes } from "@/utils/common"
import http from "@/utils/http"

type SettingsProps = {
  open: boolean
  onClose: () => void
}

enum SettingsSection {
  Storage = "storage",
  Bots = "bots",
  Other = "other",
}

const categories = [
  {
    id: SettingsSection.Storage,
    icon: <StorageIcon />,
  },
  { id: SettingsSection.Bots, icon: <SmartToy /> },
  { id: SettingsSection.Other, icon: <MiscellaneousServicesIcon /> },
]

const validateBots = (value?: string) => {
  if (value) {
    const regexPattern = /^\d{10}:[A-Za-z\d_-]{35}$/gm
    return regexPattern.test(value) || "Invalid Token format"
  }
}

const RevokeButton = memo(() => {
  const [isRevoking, setIsRevoking] = useState<boolean>(false)

  const revoke = useCallback(() => {
    setIsRevoking(true)
    http
      .get("/api/users/bots/revoke")
      .then(() => {
        toast.success("session revoked")
      })
      .finally(() => {
        setIsRevoking(false)
      })
  }, [])

  return (
    <Tooltip title="Revoke Bot Session">
      <IconButton
        sx={{ marginTop: "1rem" }}
        disabled={isRevoking}
        onClick={revoke}
      >
        <CancelPresentationIcon />
      </IconButton>
    </Tooltip>
  )
})

type RemoveButtonProps = {
  isRemoving: boolean
  onClick: () => void
}

const RemoveButton = memo(({ isRemoving, onClick }: RemoveButtonProps) => {
  return (
    <Tooltip title="Remove Bots">
      <IconButton
        sx={{ marginTop: "1rem" }}
        disabled={isRemoving}
        onClick={onClick}
      >
        <RemoveCircleOutlineIcon />
      </IconButton>
    </Tooltip>
  )
})

const StorageTab: React.FC<{ control: Control<Settings, any> }> = memo(
  ({ control }) => {
    const intl = useIntl()

    const storageCards = [
      {
        title: "Total Storage",
        dataKey: "totalSize",
        formatter: (value: number) =>
          defaultFormatters.formatFileSize(intl, {
            size: value,
          } as FileData),
      },
      {
        title: "Total Files",
        dataKey: "totalFiles",
      },
    ]

    const { value, setTrue } = useBoolean(false)

    const { data: session } = useSession()

    const { data, isLoading } = useQuery({
      queryKey: ["user", "stats", session?.userName],
      queryFn: async () =>
        (await http.get<AccountStats>("/api/users/stats")).data,
    })

    const { data: channelData, isLoading: channelLoading } = useQuery({
      queryKey: ["user", "channels", session?.userName],
      queryFn: async () =>
        (await http.get<Channel[]>("/api/users/channels")).data,
      enabled: value,
    })

    return (
      <>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {storageCards.map((card, index) => (
            <Box key={card.dataKey} sx={{ margin: "auto" }}>
              {isLoading ? (
                <Skeleton
                  sx={{
                    height: 140,
                    width: "50%",
                    maxHeight: 140,
                    minWidth: 200,
                    borderRadius: "20px",
                  }}
                  animation="wave"
                  variant="rectangular"
                />
              ) : (
                <Card
                  sx={{
                    width: "50%",
                    maxHeight: 140,
                    minWidth: 200,
                    cursor: "pointer",
                    bgcolor: "primaryContainer.main",
                  }}
                >
                  <CardContent>
                    <Typography variant="h5" component="div">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {card.formatter
                        ? card.formatter(data?.[card.dataKey] as number)
                        : data?.[card.dataKey]}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          ))}
        </Box>
        {data && (
          <Controller
            name="channel"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange } }) => (
              <Autocomplete
                onOpen={setTrue}
                sx={{ marginTop: "2rem" }}
                onChange={(event, item) => {
                  onChange(item)
                }}
                defaultValue={
                  data.channelId
                    ? {
                        channelId: data.channelId,
                        channelName: data.channelName,
                      }
                    : undefined
                }
                options={channelData ? channelData : []}
                getOptionLabel={(option) => option.channelName}
                isOptionEqualToValue={(option, value) =>
                  option.channelName === value.channelName
                }
                filterSelectedOptions
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Set Default Channel"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {channelLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />
        )}
      </>
    )
  }
)

const BotTab: React.FC<{ control: Control<Settings, any> }> = memo(
  ({ control }) => {
    const { data: session } = useSession()

    const { data, refetch } = useQuery({
      queryKey: ["user", "bots", session?.userName],
      queryFn: async () => (await http.get<string[]>("/api/users/bots")).data,
    })

    const [isRemoving, setIsRemoving] = useState<boolean>(false)

    const removeBots = useCallback(() => {
      setIsRemoving(true)
      http
        .delete("/api/users/bots")
        .then(() => {
          toast.success("bots removed")
        })
        .finally(() => {
          refetch().finally(() => {
            setIsRemoving(false)
          })
        })
    }, [])

    const copyTokens = useCallback(() => {
      if (data && data.length > 0) {
        copyDataToClipboard(data).then(() => {
          toast.success("Tokens Copied")
        })
      }
    }, [data])

    return (
      <>
        <Typography component="p">{"Enter bots here  1 per line:"}</Typography>
        <Controller
          name="bots"
          control={control}
          rules={{ required: true, validate: validateBots }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              sx={{ margin: "1rem", width: "90%" }}
              label="Add Bots"
              id="bots"
              placeholder="Enter New Bots"
              rows={5}
              autoComplete="off"
              multiline
              helperText={error ? error.message : ""}
            />
          )}
        />
        {data && (
          <>
            <Typography sx={{ marginTop: "1rem" }} component="h6">
              {`Current Bots : ${data.length}`}
            </Typography>
            <Box sx={{ display: "flex", gap: "1rem" }}>
              {data.length > 0 && (
                <RemoveButton isRemoving={isRemoving} onClick={removeBots} />
              )}
              <RevokeButton />
              <Tooltip title="Copy Tokens">
                <IconButton sx={{ marginTop: "1rem" }} onClick={copyTokens}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </>
    )
  }
)

const OtherTab: React.FC<{ control: Control<Settings, any> }> = memo(
  ({ control }) => {
    return (
      <>
        <Controller
          name="resizerHost"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              fullWidth
              error={!!error}
              type="text"
              label="Image Resizer Host"
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
              type="number"
              id="uploadConcurrency"
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
              id="splitFileSize"
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
        <Controller
          name="encryptFiles"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Encrypt Files"
              fullWidth
              id="encryptFiles"
              margin="normal"
              helperText={error ? error.message : ""}
            >
              {["yes", "no"].map((val, index) => (
                <MenuItem key={index} value={val}>
                  {val}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="pageSize"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              id="pageSize"
              fullWidth
              type="number"
              error={!!error}
              label="Page Size"
              helperText={error ? error.message : ""}
            />
          )}
        />
      </>
    )
  }
)

function SettingsDialog({ open, onClose }: SettingsProps) {
  const { settings, setSettings } = useSettings()

  const [tabId, setTabID] = useState<string>(SettingsSection.Storage)

  const [isSaving, setIsSaving] = useState(false)

  const { control, handleSubmit } = useForm<Settings>({
    defaultValues: settings,
  })

  const queryClient = useQueryClient()

  const onSubmit: SubmitHandler<Settings> = useCallback(
    async (settings) => {
      switch (tabId) {
        case SettingsSection.Storage:
          setIsSaving(true)
          try {
            await http.patch("/api/users/channels", settings.channel)
            toast.success("channel updated")
            queryClient.invalidateQueries({ queryKey: ["user", "stats"] })
            queryClient.invalidateQueries({ queryKey: ["user", "bots"] })
          } catch (err) {
            const error = err as AxiosError<Message>
            if (error.response)
              toast.error(
                error.response.data.error || error.response.data.message
              )
          } finally {
            setIsSaving(false)
          }
          break

        case SettingsSection.Bots:
          const bots = settings.bots?.trim().split("\n")
          if (bots?.length! > 0) {
            setIsSaving(true)
            try {
              await http.post("/api/users/bots", bots)
              toast.success("bots added")
              queryClient.invalidateQueries({ queryKey: ["user", "bots"] })
            } catch (err) {
              const error = err as AxiosError<Message>
              if (error.response)
                toast.error(
                  error.response.data.message?.split(":").slice(-1)[0]
                )
            } finally {
              setIsSaving(false)
            }
          }
          break
        case SettingsSection.Other:
          const {
            uploadConcurrency,
            splitFileSize,
            pageSize,
            encryptFiles,
            resizerHost,
          } = settings
          setSettings({
            uploadConcurrency: uploadConcurrency
              ? Number(uploadConcurrency)
              : 4,
            splitFileSize,
            pageSize: pageSize ? Number(pageSize) : 500,
            encryptFiles,
            resizerHost,
          })
          break
        default:
          break
      }
    },
    [tabId]
  )
  const renderTabSection = useCallback(() => {
    switch (tabId) {
      case SettingsSection.Storage:
        return <StorageTab control={control} />

      case SettingsSection.Bots:
        return <BotTab control={control} />

      case SettingsSection.Other:
        return <OtherTab control={control} />

      default:
        return null
    }
  }, [tabId])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: "34rem" },
      }}
    >
      <Box sx={{ height: 8 }}>{isSaving && <LinearProgress />}</Box>
      <DialogContent sx={{ py: 2, px: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            height: "100%",
          }}
        >
          <TabContext value={tabId}>
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                overflow: "auto",
              }}
            >
              <TabList
                onChange={(_, newValue: string) => setTabID(newValue)}
                aria-label="Settings Tabs"
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
              >
                {categories.map(({ id, icon }) => (
                  <Tab icon={icon} key={id} label={id} value={id} />
                ))}
              </TabList>
              <Box
                sx={{
                  height: "50vh",
                  overflow: "auto",
                }}
              >
                <TabPanel value={tabId}>{renderTabSection()}</TabPanel>
              </Box>
            </Box>
          </TabContext>
          <Box
            id="hook-form"
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ flex: 1 }}
          ></Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={isSaving} type="submit" form="hook-form">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SettingsDialog
