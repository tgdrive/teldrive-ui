import { memo, useCallback, useState } from "react";
import type { AccountStats, Channel, Message, UserSession } from "@/types";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, scrollbarClasses, Select, SelectItem, Textarea } from "@tw-material/react";
import IcRoundCancel from "~icons/ic/round-cancel";
import IcRoundCheckCircle from "~icons/ic/round-check-circle";
import IcRoundContentCopy from "~icons/ic/round-content-copy";
import IcRoundRemoveCircleOutline from "~icons/ic/round-remove-circle-outline";
import clsx from "clsx";
import type { AxiosError } from "feaxios";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { chunkArray, copyDataToClipboard } from "@/utils/common";
import http from "@/utils/http";
import { userQueries } from "@/utils/query-options";

const validateBots = (value?: string) => {
  if (value) {
    const regexPattern = /^\d{10}:[A-Za-z\d_-]{35}$/gm;
    return regexPattern.test(value) || "Invalid Token format";
  }
  return false;
};

async function updateChannel(channel: Channel) {
  return http.patch("/api/users/channels", { ...channel }).then(() => {
    toast.success("Channel updated");
  });
}

const Session = memo(({ appName, location, createdAt, valid, hash, current }: UserSession) => {
  const deleteSession = userQueries.deleteSession();

  return (
    <div
      className={clsx(
        "flex  flex-col justify-between p-4 rounded-lg gap-1 relative",
        valid ? "bg-green-500/20" : "bg-red-500/20",
      )}
    >
      {(!current || !valid) && (
        <Button
          isIconOnly
          variant="text"
          size="sm"
          className="absolute top-1 right-1"
          onPress={() => deleteSession.mutateAsync(hash)}
        >
          <IcRoundCancel />
        </Button>
      )}

      <div className="flex gap-1 items-center">
        {valid ? (
          <IcRoundCheckCircle className="text-green-500 size-4" />
        ) : (
          <IcRoundCancel className="text-red-500 size-4" />
        )}
        <p className="font-medium">{appName || "Unknown"}</p>
      </div>
      <p className="text-sm font-normal">
        Created : {new Date(createdAt).toISOString().split("T")[0]}
      </p>
      {location && <p className="text-sm font-normal">Location : {location}</p>}
    </div>
  );
});

export const AccountTab = memo(() => {
  const { control, handleSubmit } = useForm<{ tokens: string }>({
    defaultValues: { tokens: "" },
  });

  const { data: session } = useQuery(userQueries.session());

  const [
    { data, refetch, isSuccess },
    { data: sessions, isSuccess: sessionsLoaded },
    { data: channelData, isLoading: channelLoading },
  ] = useQueries({
    queries: [
      userQueries.stats(session?.userName!),
      userQueries.sessions(),
      userQueries.channels(session?.userName!),
    ],
  });

  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const removeBots = useCallback(() => {
    setIsRemoving(true);
    http
      .delete("/api/users/bots")
      .then(() => {
        toast.success("bots removed");
      })
      .finally(() => {
        refetch().finally(() => {
          setIsRemoving(false);
        });
      });
  }, []);

  const copyTokens = useCallback(() => {
    if (data && data.bots.length > 0) {
      copyDataToClipboard(data.bots).then(() => {
        toast.success("Tokens Copied");
      });
    }
  }, [data?.bots]);

  const onSubmit = useCallback(async ({ tokens }: { tokens: string }) => {
    const tokensList = tokens.trim().split("\n");
    if (tokensList?.length! > 0) {
      setIsSaving(true);
      try {
        const tokenPromies = chunkArray(tokensList, 8).map((tokens) =>
          http.post<Message>("/api/users/bots", tokens),
        );
        await Promise.all(tokenPromies);
        toast.success("bots added");
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      } catch (err) {
        const error = err as AxiosError<Message>;
        if (error.response) {
          toast.error(error.response.data.message?.split(":").slice(-1)[0]);
        }
      } finally {
        setIsSaving(false);
      }
    }
  }, []);

  const handleSelectionChange = useCallback(
    (value: any) => {
      const channelId = Number.parseInt([...value][0]);
      const channelName = channelData?.find((c) => c.channelId === channelId)?.channelName;

      updateChannel({ channelId, channelName }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      });
    },
    [channelData],
  );

  return (
    <div className={clsx("grid grid-cols-6 gap-8 p-2 w-full overflow-y-auto", scrollbarClasses)}>
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
        {isSuccess && (
          <Select
            aria-label="Select Channel"
            size="lg"
            isLoading={channelLoading}
            className="col-span-6 xs:col-span-3"
            scrollShadowProps={{
              isEnabled: false,
            }}
            classNames={{
              popoverContent: "rounded-lg shadow-1",
            }}
            variant="bordered"
            items={channelData || []}
            defaultSelectedKeys={[data?.channelId ? data.channelId.toString() : ""]}
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
      <div className="col-span-6">
        <p className="text-lg font-medium">Sessions</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Active sessions for your account
        </p>
        <div className="flex pt-2 flex-wrap gap-2">
          {sessionsLoaded &&
            sessions?.map((session) => <Session key={session.hash} {...session} />)}
        </div>
      </div>
    </div>
  );
});
