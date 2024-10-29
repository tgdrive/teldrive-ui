import { memo, useCallback, useEffect, useState } from "react";
import type { QueryParams } from "@/types";
import { FbActions } from "@tw-material/file-browser";
import {
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
} from "@tw-material/react";
import { useShallow } from "zustand/react/shallow";

import { shareQueries, fileQueries } from "@/utils/query-options";
import { useModalStore } from "@/utils/stores";
import { Controller, useForm } from "react-hook-form";
import { CustomActions } from "@/hooks/use-file-action";
import { CopyButton } from "@/components/copy-button";
import { useQuery } from "@tanstack/react-query";
import IcRoundClose from "~icons/ic/round-close";
import { getNextDate } from "@/utils/common";
import ShowPasswordIcon from "~icons/mdi/eye-outline";
import HidePasswordIcon from "~icons/mdi/eye-off-outline";
import MdiProtectedOutline from "~icons/mdi/protected-outline";

type FileModalProps = {
  queryKey: any[];
};

interface RenameDialogProps {
  queryKey: any[];
  handleClose: () => void;
}

const RenameDialog = memo(({ queryKey, handleClose }: RenameDialogProps) => {
  const updateMutation = fileQueries.update(queryKey);
  const { currentFile, actions } = useModalStore(
    useShallow((state) => ({
      currentFile: state.currentFile,
      actions: state.actions,
    }))
  );

  const onRename = useCallback(() => {
    updateMutation.mutate({
      id: currentFile?.id,
      payload: {
        name: currentFile?.name,
        type: currentFile?.type,
      },
    });
    handleClose();
  }, [currentFile.name, currentFile.id]);

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Rename</ModalHeader>
      <ModalBody>
        <Input
          size="lg"
          variant="bordered"
          classNames={{
            inputWrapper: "border-primary border-large",
          }}
          autoFocus
          value={currentFile.name}
          onValueChange={(value) =>
            actions.setCurrentFile({ ...currentFile, name: value })
          }
        />
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Close
        </Button>
        <Button
          className="font-normal"
          variant="filledTonal"
          onPress={onRename}
        >
          Rename
        </Button>
      </ModalFooter>
    </>
  );
});

interface FolderCreateDialogProps {
  queryKey: any[];
  handleClose: () => void;
}

const FolderCreateDialog = memo(
  ({ queryKey, handleClose }: FolderCreateDialogProps) => {
    const createMutation = fileQueries.create(queryKey);

    const { currentFile, actions } = useModalStore(
      useShallow((state) => ({
        currentFile: state.currentFile,
        actions: state.actions,
      }))
    );

    const onCreate = useCallback(() => {
      createMutation
        .mutateAsync({
          name: currentFile.name,
          type: "folder",
          path: (queryKey[1] as QueryParams).search?.path || "/",
        })
        .then(() => handleClose());
    }, [currentFile.name]);

    return (
      <>
        <ModalHeader className="flex flex-col gap-1">Create Folder</ModalHeader>
        <ModalBody>
          <Input
            size="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "border-primary border-large",
            }}
            autoFocus
            value={currentFile?.name}
            onValueChange={(value) =>
              actions.setCurrentFile({ ...currentFile, name: value })
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button className="font-normal" variant="text" onPress={handleClose}>
            Close
          </Button>
          <Button
            className="font-normal"
            variant="filledTonal"
            onPress={onCreate}
            isDisabled={createMutation.isPending || !currentFile.name}
            isLoading={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating" : "Create"}
          </Button>
        </ModalFooter>
      </>
    );
  }
);

interface DeleteDialogProps {
  queryKey: any[];
  handleClose: () => void;
}

const DeleteDialog = memo(({ handleClose, queryKey }: DeleteDialogProps) => {
  const deleteMutation = fileQueries.delete(queryKey);

  const selectedFiles = useModalStore(
    (state) => state.selectedFiles
  ) as string[];

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ files: selectedFiles });
    handleClose();
  }, []);

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Delete Files</ModalHeader>
      <ModalBody>
        <h1 className="text-large font-medium mt-2">
          {`Are you sure to delete ${selectedFiles.length} file${
            selectedFiles.length > 1 ? "s" : ""
          } ?`}
        </h1>
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
          onPress={onDelete}
        >
          Yes
        </Button>
      </ModalFooter>
    </>
  );
});

interface ShareFileDialogProps {
  handleClose: () => void;
}

const defaultShareOptions = {
  expirationDate: "",
  password: "",
};

const ShareFileDialog = memo(({ handleClose }: ShareFileDialogProps) => {
  const file = useModalStore((state) => state.currentFile);

  const shareQueryOptions = shareQueries.shareByFileId(file?.id);

  const { data, isLoading } = useQuery(shareQueryOptions);

  const { control, handleSubmit } = useForm({
    defaultValues: defaultShareOptions,
  });

  const createShare = shareQueries.create(file.id, shareQueryOptions.queryKey);

  const deleteShare = shareQueries.delete(file.id, shareQueryOptions.queryKey);

  const [sharingOn, setSharingOn] = useState(false);

  const [shareLink, setShareLink] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const onShareChange = useCallback(() => {
    setSharingOn((prev) => {
      if (!prev) {
        handleSubmit((data) => {
          const payload = {} as Record<string, string>;
          if (data.expirationDate) {
            payload.expirationDate = `${data.expirationDate}${new Date()
              .toISOString()
              .slice(10)}`;
          }
          if (data.password) {
            payload.password = data.password;
          }
          createShare.mutateAsync(payload);
        })();
      }
      if (prev) {
        deleteShare.mutateAsync();
        setShareLink("");
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (data) {
      setSharingOn(true);
      setShareLink(`${window.location.origin}/share/${data.id}`);
    }
  }, [data]);

  return (
    <>
      <ModalHeader className="flex items-center justify-between ">
        Share Files
        <Button size="sm" variant="text" isIconOnly onPress={handleClose}>
          <IcRoundClose />
        </Button>
      </ModalHeader>
      <ModalBody>
        <form className="grid grid-cols-6 gap-8 p-2 w-full overflow-y-auto">
          <div className="col-span-6 xs:col-span-3">
            <p className="text-lg font-medium">Set expiration date</p>
            <p className="text-sm font-normal text-on-surface-variant">
              Link expiration date
            </p>
          </div>
          <Controller
            name="expirationDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                size="lg"
                className="col-span-6 xs:col-span-3"
                variant="bordered"
                isInvalid={!!error}
                errorMessage={error?.message}
                type="date"
                min={getNextDate()}
                {...field}
              />
            )}
          />
          <div className="col-span-6 xs:col-span-3">
            <p className="text-lg font-medium">Set link password</p>
            <p className="text-sm font-normal text-on-surface-variant">
              Public link password
            </p>
          </div>
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                size="lg"
                className="col-span-6 xs:col-span-3"
                variant="bordered"
                autoComplete="off"
                isInvalid={!!error}
                errorMessage={error?.message}
                type={showPassword ? "text" : "password"}
                {...field}
                endContent={
                  <Button
                    isIconOnly
                    className="size-8 min-w-8"
                    variant="text"
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                  </Button>
                }
              />
            )}
          />
        </form>
        <Divider />
        <div className="flex justify-between">
          <h1 className="text-large font-medium mt-2">
            Sharing {sharingOn ? "On" : "Off"}
          </h1>
          <div className="flex items-center gap-3">
            {data?.protected && (
              <MdiProtectedOutline className="text-primary" />
            )}

            <Switch size="md" isSelected={sharingOn} onChange={onShareChange} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Input
          isDisabled={isLoading || !data}
          fullWidth
          variant="bordered"
          readOnly
          value={shareLink}
        />
        <CopyButton value={shareLink} isDisabled={isLoading || !data} />
      </ModalFooter>
    </>
  );
});

export const FileOperationModal = memo(({ queryKey }: FileModalProps) => {
  const { open, operation, actions } = useModalStore(
    useShallow((state) => ({
      open: state.open,
      operation: state.operation,
      actions: state.actions,
    }))
  );

  const handleClose = useCallback(
    () =>
      actions.set({
        open: false,
      }),
    []
  );

  const renderOperation = () => {
    switch (operation) {
      case FbActions.RenameFile.id:
        return <RenameDialog queryKey={queryKey} handleClose={handleClose} />;
      case FbActions.CreateFolder.id:
        return (
          <FolderCreateDialog queryKey={queryKey} handleClose={handleClose} />
        );
      case FbActions.DeleteFiles.id:
        return <DeleteDialog queryKey={queryKey} handleClose={handleClose} />;
      case CustomActions.ShareFiles.id:
        return <ShareFileDialog handleClose={handleClose} />;
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
});
