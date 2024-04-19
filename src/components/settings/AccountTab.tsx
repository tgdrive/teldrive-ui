import { memo, useCallback, useState } from "react"
import { AccountStats, Channel, Message } from "@/types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  scrollbarClasses,
  Select,
  SelectItem,
  Textarea,
} from "@tw-material/react"
import IcRoundContentCopy from "~icons/ic/round-content-copy"
import IcRoundRemoveCircleOutline from "~icons/ic/round-remove-circle-outline"
import clsx from "clsx"
import { AxiosError } from "feaxios"
import { Controller, useForm } from "react-hook-form"
import toast from "react-hot-toast"

import { copyDataToClipboard } from "@/utils/common"
import http from "@/utils/http"
import { sessionQueryOptions } from "@/utils/queryOptions"

const validateBots = (value?: string) => {
  if (value) {
    const regexPattern = /^\d{10}:[A-Za-z\d_-]{35}$/gm
    return regexPattern.test(value) || "Invalid Token format"
  }
  return false
}

async function updateChannel(channelId: number) {
  return http.patch("/api/users/channels", { channelId }).then(() => {
    toast.success("Channel updated")
  })
}

export const AccountTab = memo(() => {
  const { control, handleSubmit } = useForm<{ tokens: string }>({
    defaultValues: { tokens: "" },
  })

  const { data: session } = useQuery(sessionQueryOptions)

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["stats", session?.userName],
    queryFn: async () =>
      (await http.get<AccountStats>("/api/users/stats")).data,
  })

  const { data: channelData, isLoading: channelLoading } = useQuery({
    queryKey: ["channels", session?.userName],
    queryFn: async () =>
      (await http.get<Channel[]>("/api/users/channels")).data,
  })

  const [isRemoving, setIsRemoving] = useState<boolean>(false)

  const [isSaving, setIsSaving] = useState<boolean>(false)

  const queryClient = useQueryClient()

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
    if (data && data.bots.length > 0) {
      copyDataToClipboard(data.bots).then(() => {
        toast.success("Tokens Copied")
      })
    }
  }, [data?.bots])

  const onSubmit = useCallback(async ({ tokens }: { tokens: string }) => {
    const tokensList = tokens.trim().split("\n")
    if (tokensList?.length! > 0) {
      setIsSaving(true)
      try {
        await http.post("/api/users/bots", tokensList)
        toast.success("bots added")
        queryClient.invalidateQueries({ queryKey: ["user", "bots"] })
      } catch (err) {
        const error = err as AxiosError<Message>
        if (error.response)
          toast.error(error.response.data.message?.split(":").slice(-1)[0])
      } finally {
        setIsSaving(false)
      }
    }
  }, [])

  const handleSelectionChange = useCallback((value: any) => {
    updateChannel(parseInt([...value][0])).then(() => {
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    })
  }, [])

  return (
    <div
      className={clsx(
        "grid grid-cols-6 gap-8 p-2 w-full overflow-y-auto",
        scrollbarClasses
      )}
    >
      <div className="col-span-6 xs:col-span-3 flex flex-col justify-around">
        <div>
          <p className="text-lg font-medium">Add Bots</p>
          <p className="text-sm font-normal text-on-surface-variant">
            Add bots tokens to your account
          </p>
        </div>
        <div className="col-span-6 xs:col-span-3 flex flex-col gap-2">
          <p className="text-lg font-medium">{`Current Bots: ${data?.bots.length || 0}`}</p>
          <div className="inline-flex gap-4">
            <Button
              title="Copy Tokens to Clipboard"
              variant="text"
              className="text-inherit"
              onPress={copyTokens}
              isIconOnly
            >
              <IcRoundContentCopy />
            </Button>

            <Button
              variant="text"
              title="Remove Bots"
              className="text-inherit"
              onPress={removeBots}
              isLoading={isRemoving}
              isIconOnly
            >
              <IcRoundRemoveCircleOutline />
            </Button>
          </div>
        </div>
      </div>
      <div className="col-span-6 xs:col-span-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <Controller
            name="tokens"
            control={control}
            rules={{ required: true, validate: validateBots }}
            render={({ field, fieldState: { error } }) => (
              <Textarea
                {...field}
                disableAutosize
                classNames={{
                  input: "h-32",
                }}
                placeholder="Enter tokens 1 per line"
                autoComplete="off"
                errorMessage={error ? error.message : ""}
                isInvalid={!!error}
              />
            )}
          />
          <Button isLoading={isSaving} type="submit" variant="filledTonal">
            Add Bots
          </Button>
        </form>
      </div>
      <div className="col-span-6 xs:col-span-3">
        <p className="text-lg font-medium">Select Channel</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Select the default telegram channel
        </p>
      </div>
      <div className="col-span-6 xs:col-span-3">
        {!isLoading && (
          <Select
            aria-label="Select Channel"
            size="lg"
            isLoading={channelLoading}
            className="col-span-6 xs:col-span-3"
            variant="bordered"
            items={channelData || []}
            defaultSelectedKeys={[data?.channelId.toString() || ""]}
            onSelectionChange={handleSelectionChange}
          >
            {(channel) => (
              <SelectItem key={channel.channelId} value={channel.channelId}>
                {channel.channelName}
              </SelectItem>
            )}
          </Select>
        )}
      </div>
    </div>
  )
})
