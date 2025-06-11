import { memo, useCallback, useState } from "react";
import type { UserSession } from "@/types";
import { useMutation, useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import {
  Button,
  scrollbarClasses,
  Textarea,
  RadioGroup,
  Radio,
  Input,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Modal,
  ModalContent,
} from "@tw-material/react";
import IcRoundCancel from "~icons/ic/round-cancel";
import IcRoundCheckCircle from "~icons/ic/round-check-circle";
import IcRoundContentCopy from "~icons/ic/round-content-copy";
import IcRoundRemoveCircleOutline from "~icons/ic/round-remove-circle-outline";
import clsx from "clsx";

import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { chunkArray, copyDataToClipboard } from "@/utils/common";
import { $api, fetchClient } from "@/utils/api";

import type { components } from "@/lib/api";
import { NetworkError } from "@/utils/fetch-throw";
import SyncIcon from "~icons/material-symbols/sync";
import DeleteIcon from "~icons/material-symbols/delete";
import AddIcon from "~icons/material-symbols/add-circle";

const validateBots = (value?: string) => {
  if (value) {
    const regexPattern = /^\d{10}:[A-Za-z\d_-]{35}$/gm;
    return regexPattern.test(value) || "Invalid Token format";
  }
  return false;
};

const Session = memo(({ appName, location, createdAt, valid, hash, current }: UserSession) => {
  const deleteSession = $api.useMutation("delete", "/users/sessions/{id}", {
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: $api.queryKey("get", "/users/sessions") });
    },
  });
  const queryClient = useQueryClient();

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
          onPress={() => deleteSession.mutateAsync({ params: { path: { id: hash } } })}
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

const ChannelCreateDialog = ({ handleClose }: { handleClose: () => void }) => {
  const queryClient = useQueryClient();
  const createChannel = $api.useMutation("post", "/users/channels", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/channels"] });
      toast.success("Channel Added");
    },
  });

  const [channel, setChannel] = useState("");

  const onCreate = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      createChannel
        .mutateAsync({
          body: {
            channelName: channel,
          },
        })
        .then(() => handleClose());
    },
    [channel],
  );

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Create Channel</ModalHeader>
      <ModalBody as="form" id="add-channel" onSubmit={onCreate}>
        <Input
          size="lg"
          variant="bordered"
          classNames={{
            inputWrapper: "border-primary border-large",
          }}
          placeholder="Channel Name"
          autoFocus
          value={channel}
          onValueChange={setChannel}
        />
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Close
        </Button>
        <Button
          type="submit"
          form="add-channel"
          className="font-normal"
          variant="filledTonal"
          isDisabled={createChannel.isPending || !channel}
          isLoading={createChannel.isPending}
        >
          {createChannel.isPending ? "Creating" : "Create"}
        </Button>
      </ModalFooter>
    </>
  );
};

const ChannelDeleteDialog = ({
  channelId,
  handleClose,
}: { channelId: number; handleClose: () => void }) => {
  const queryClient = useQueryClient();

  const deleteChannel = $api.useMutation("delete", "/users/channels/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/channels"] });
      toast.success("Channel Deleted");
    },
  });

  const onDelete = useCallback(() => {
    deleteChannel
      .mutateAsync({
        params: {
          path: {
            id: String(channelId),
          },
        },
      })
      .then(() => handleClose());
  }, [channelId]);
  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Delete Channel</ModalHeader>
      <ModalBody>
        <h1 className="text-large font-medium mt-2">Are you sure to delete this channel</h1>
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          No
        </Button>
        <Button
          variant="filledTonal"
          classNames={{
            base: "font-normal",
          }}
          isLoading={deleteChannel.isPending}
          onPress={onDelete}
        >
          Yes
        </Button>
      </ModalFooter>
    </>
  );
};

interface ChannelOperationProps {
  open: boolean;
  handleClose: () => void;
  operation: "add" | "delete";
  channelId: number;
}

const ChannelOperationModal = memo(
  ({ open, handleClose, operation, channelId }: ChannelOperationProps) => {
    const renderOperation = () => {
      switch (operation) {
        case "add":
          return <ChannelCreateDialog handleClose={handleClose} />;
        case "delete":
          return <ChannelDeleteDialog channelId={channelId} handleClose={handleClose} />;
        default:
          return null;
      }
    };
    return (
      <Modal
        isOpen={open}
        size="md"
        classNames={{
          wrapper: "overflow-hidden",
          base: "bg-surface w-full shadow-none",
        }}
        placement="center"
        onClose={handleClose}
        hideCloseButton
      >
        <ModalContent>{renderOperation}</ModalContent>
      </Modal>
    );
  },
);

export const AccountTab = memo(() => {
  const { control, handleSubmit } = useForm<{ tokens: string }>({
    defaultValues: { tokens: "" },
  });

  const [{ data: userConfig }, { data: sessions }, { data: channelData }] = useSuspenseQueries({
    queries: [
      $api.queryOptions("get", "/users/config"),
      $api.queryOptions("get", "/users/sessions"),
      $api.queryOptions("get", "/users/channels"),
    ],
  });

  const removeBots = $api.useMutation("delete", "/users/bots");

  const syncChannels = $api.useMutation("patch", "/users/channels/sync", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get", "/users/channels"] });
      toast.success("Channels Synced");
    },
    onError: async (error) => {
      if (error instanceof NetworkError) {
        const errorData = (await error.data?.json()) as components["schemas"]["Error"];
        toast.error(`Sync failed: ${errorData.message.split(":").slice(-1)[0]!.trim()}`);
      } else {
        toast.error("Sync failed: An unknown error occurred.");
      }
    },
  });

  const queryClient = useQueryClient();

  const copyTokens = useCallback(() => {
    if (userConfig && userConfig.bots.length > 0) {
      copyDataToClipboard(userConfig.bots).then(() => {
        toast.success("Tokens Copied");
      });
    }
  }, [userConfig?.bots]);

  const botAddition = useMutation({
    mutationFn: async (tokens: string) => {
      const tokensList = tokens.trim().split("\n");
      if (tokensList.length === 0) {
        throw new Error("No tokens provided");
      }
      const tokenPromises = chunkArray(tokensList, 8).map((tokens) =>
        fetchClient.POST("/users/bots", {
          body: {
            bots: tokens,
          },
        }),
      );
      return Promise.all(tokenPromises);
    },
    onSuccess: () => {
      toast.success("bots added");
      queryClient.invalidateQueries({ queryKey: ["get", "/users/config"] });
    },
    onError: async (error) => {
      if (error instanceof NetworkError) {
        const errorData = (await error.data?.json()) as components["schemas"]["Error"];
        toast.error(errorData.message.split(":").slice(-1)[0]!.trim());
      }
    },
  });
  const updateChannel = $api.useMutation("patch", "/users/channels", {
    onSuccess: () => {
      toast.success("Default channel updated");
      queryClient.invalidateQueries({ queryKey: ["get", "/users/config"] });
    },
    onError: async (error) => {
      if (error instanceof NetworkError) {
        const errorData = (await error.data?.json()) as components["schemas"]["Error"];
        toast.error(
          `Failed to update default channel: ${errorData.message.split(":").slice(-1)[0]!.trim()}`,
        );
      } else {
        toast.error("Failed to update default channel: An unknown error occurred.");
      }
    },
  });

  const onSubmit = useCallback(
    async ({ tokens }: { tokens: string }) => {
      botAddition.mutateAsync(tokens);
    },
    [botAddition],
  );

  const handleSetDefaultChannel = useCallback(
    (channelId: number) => {
      const channel = channelData?.find((c) => c.channelId === channelId);
      if (channel) {
        updateChannel.mutate({
          body: { channelId: channel.channelId, channelName: channel.channelName },
        });
      }
    },
    [channelData, updateChannel],
  );

  const [open, setOpen] = useState(false);

  const [channelOperation, setChannelOperation] = useState<"add" | "delete">("add");

  const [channelID, setChannelID] = useState(0);

  return (
    <div
      className={clsx("flex flex-col gap-6 p-4 w-full h-full overflow-y-auto", scrollbarClasses)}
    >
      <div className="p-4 rounded-lg border border-outline-variant">
        <h4 className="text-lg font-medium pb-2">Manage Bots</h4>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 mb-4">
          <Controller
            name="tokens"
            control={control}
            rules={{ required: true, validate: validateBots }}
            render={({ field, fieldState: { error } }) => (
              <Textarea
                {...field}
                disableAutosize
                classNames={{
                  input: "h-32 min-h-[8rem]",
                  inputWrapper:
                    "bg-surface-container-low data-[hover=true]:bg-surface-container group-data-[focus=true]:bg-surface-container",
                }}
                placeholder="Enter tokens 1 per line"
                autoComplete="off"
                errorMessage={error ? error.message : ""}
                isInvalid={!!error}
              />
            )}
          />
          <Button
            isLoading={botAddition.isPending}
            type="submit"
            variant="filledTonal"
            className="self-start"
          >
            Add Bots
          </Button>
        </form>
        <div className="flex justify-between items-center pt-2">
          <p className="text-base font-medium">{`Current Bots: ${userConfig?.bots.length || 0}`}</p>
          <div className="inline-flex gap-2">
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
              title="Remove All Bots"
              className="text-inherit"
              onPress={() => removeBots.mutate({})}
              isLoading={removeBots.isPending}
              isIconOnly
            >
              <IcRoundRemoveCircleOutline />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-outline-variant flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-medium">Channels</h4>
            <p className="text-sm font-normal text-on-surface-variant">Manage available channels</p>
          </div>
          <ChannelOperationModal
            open={open}
            handleClose={() => setOpen(false)}
            operation={channelOperation}
            channelId={channelID}
          />
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="text"
              title="Add Channel"
              onPress={() => {
                setChannelOperation("add");
                setOpen(true);
              }}
            >
              <AddIcon />
            </Button>
            <Button
              isIconOnly
              variant="text"
              title="Sync Channels"
              isLoading={syncChannels.isPending}
              className={clsx(syncChannels.isPending && "pointer-events-none", "flex-shrink-0")}
              onPress={() => syncChannels.mutate({})}
            >
              <SyncIcon className={clsx(syncChannels.isPending && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div>
          {channelData && channelData.length > 0 ? (
            <RadioGroup
              aria-label="Select Default Channel"
              value={userConfig.channelId?.toString() || ""}
              onValueChange={(value) => handleSetDefaultChannel(Number(value))}
              classNames={{ wrapper: "gap-2 max-h-60 overflow-y-auto pr-2" }}
            >
              {channelData.map((channel) => {
                return (
                  <div
                    key={channel.channelId}
                    className="flex justify-between items-center p-2 rounded bg-surface-container-low hover:bg-surface-container"
                  >
                    <Radio value={channel.channelId!.toString()} classNames={{ label: "text-sm" }}>
                      {channel.channelName} ({channel.channelId})
                    </Radio>
                    <Button
                      isIconOnly
                      variant="text"
                      title="Delete Channel"
                      onPress={() => {
                        setChannelOperation("delete");
                        setChannelID(channel.channelId!);
                        setOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </div>
                );
              })}
            </RadioGroup>
          ) : (
            <p className="text-sm text-on-surface-variant italic px-2">
              No channels found. Press the sync button
              <SyncIcon className="inline-block align-middle" /> to fetch your channels from
              Telegram.
            </p>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg border border-outline-variant">
        <p className="text-lg font-medium">Active Sessions</p>
        <p className="text-sm font-normal text-on-surface-variant mb-2">
          Manage active sessions for your account.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 pt-2 justify-items-start">
          {sessions?.map((session) => (
            <Session key={session.hash} {...session} />
          ))}
        </div>
      </div>
    </div>
  );
});
