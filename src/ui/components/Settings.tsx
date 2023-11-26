import React, { memo, useCallback, useEffect, useState } from "react"
import { AccountStats, Channel, Message, Settings } from "@/ui/types"
import { defaultFormatters, FileData } from "@bhunter179/chonky"
import { AccountCircle, SmartToy, WatchLater } from "@mui/icons-material"
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline"
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
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Control, Controller, SubmitHandler, useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { useIntl } from "react-intl"
import { useBoolean } from "usehooks-ts"

import { useSession } from "@/ui/hooks/useSession"
import useSettings from "@/ui/hooks/useSettings"
import { copyDataToClipboard, splitFileSizes } from "@/ui/utils/common"
import http from "@/ui/utils/http"

type SettingsProps = {
  open: boolean
  onClose: () => void
}

enum SettingsSection {
  Account = "account",
  Bots = "bots",
  Other = "other",
}

const categories = [
  {
    id: "account",
    name: "Account",
    icon: <AccountCircle />,
  },
  { id: "bots", name: "Bots", icon: <SmartToy /> },
  { id: "other", name: "Other", icon: <WatchLater /> },
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

const AccountTab: React.FC<{ control: Control<Settings, any> }> = memo(
  ({ control }) => {
    const intl = useIntl()

    const accountCards = [
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
          {accountCards.map((card, index) => (
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
          name="apiUrl"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              margin="normal"
              id="apiUrl"
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
      </>
    )
  }
)

function SettingsDialog({ open, onClose }: SettingsProps) {
  const { settings, setSettings } = useSettings()

  const [tabId, setTabID] = useState<string>(SettingsSection.Account)

  const [isSaving, setIsSaving] = useState(false)

  const { control, handleSubmit } = useForm<Settings>({
    defaultValues: settings,
  })

  const { data: session } = useSession()

  useEffect(() => {
    if (!session) setTabID(SettingsSection.Other)
  }, [session])

  const queryClient = useQueryClient()

  const onSubmit: SubmitHandler<Settings> = useCallback(
    async (settings) => {
      switch (tabId) {
        case SettingsSection.Account:
          setIsSaving(true)
          try {
            await http.patch("/api/users/channels", settings.channel)
            toast.success("channel updated")
            queryClient.invalidateQueries({ queryKey: ["user", "stats"] })
            queryClient.invalidateQueries({ queryKey: ["user", "bots"] })
          } catch (err) {
            const error = err as AxiosError<Message>
            if (error.response) toast.error(error.response.data.error!)
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
              if (error.response) toast.error(error.response.data.error!)
            } finally {
              setIsSaving(false)
            }
          }
          break
        case SettingsSection.Other:
          const { uploadConcurrency, splitFileSize, apiUrl } = settings
          setSettings({ uploadConcurrency, splitFileSize, apiUrl })
          break
        default:
          break
      }
    },
    [tabId]
  )
  const renderTabSection = useCallback(() => {
    switch (tabId) {
      case SettingsSection.Account:
        return <>{session && <AccountTab control={control} />}</>

      case SettingsSection.Bots:
        return <>{session && <BotTab control={control} />}</>

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
        sx: { boxShadow: "none", width: "75vw", maxWidth: 800, height: "70vh" },
      }}
    >
      <DialogTitle>Settings</DialogTitle>
      <Box sx={{ height: "8px" }}>{isSaving && <LinearProgress />}</Box>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            height: "100%",
          }}
        >
          <List sx={{ minWidth: "160px", width: "25%" }}>
            {categories
              .filter((item) => {
                if (item.id !== "other" && !session) {
                  return false
                }
                return true
              })
              .map(({ id: childId, name, icon }) => (
                <ListItem
                  sx={{ paddingLeft: 0, paddingRight: 2 }}
                  key={childId}
                >
                  <ListItemButton
                    selected={tabId === childId}
                    onClick={() => setTabID(childId)}
                  >
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText>{name}</ListItemText>
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Box
            id="hook-form"
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ flex: 1 }}
          >
            {renderTabSection()}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={isSaving}
          type="submit"
          form="hook-form"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SettingsDialog
