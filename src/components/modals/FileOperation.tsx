import { memo, useCallback } from "react"
import { FileQueryKey, QueryParams } from "@/types"
import { FbActions } from "@tw-material/file-browser"
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@tw-material/react"
import clsx from "clsx"
import { useShallow } from "zustand/react/shallow"

import {
  useCreateFile,
  useDeleteFile,
  useUpdateFile,
} from "@/utils/queryOptions"
import { useModalStore } from "@/utils/stores"

type FileModalProps = {
  queryKey: FileQueryKey
}

interface RenameDialogProps {
  queryKey: FileQueryKey
  handleClose: () => void
}

const RenameDialog = memo(({ queryKey, handleClose }: RenameDialogProps) => {
  const updateMutation = useUpdateFile(queryKey)
  const { currentFile, actions } = useModalStore(
    useShallow((state) => ({
      currentFile: state.currentFile,
      actions: state.actions,
    }))
  )

  const onRename = useCallback(() => {
    updateMutation.mutate({
      id: currentFile?.id,
      payload: {
        name: currentFile?.name,
        type: currentFile?.type,
      },
    })
    handleClose()
  }, [currentFile.name, currentFile.id])

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
          value={currentFile.name}
          onValueChange={(value) =>
            actions.setCurrentFile({ ...currentFile, name: value })
          }
        ></Input>
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
  )
})

interface FolderCreateDialogProps {
  queryKey: FileQueryKey
  handleClose: () => void
}

const FolderCreateDialog = memo(
  ({ queryKey, handleClose }: FolderCreateDialogProps) => {
    const createMutation = useCreateFile(queryKey)

    const { currentFile, actions } = useModalStore(
      useShallow((state) => ({
        currentFile: state.currentFile,
        actions: state.actions,
      }))
    )

    const onCreate = useCallback(() => {
      createMutation.mutate({
        name: currentFile.name,
        type: "folder",
        path: (queryKey[1] as QueryParams).path || "/",
      })
    }, [currentFile.name])

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
            value={currentFile?.name}
            onValueChange={(value) =>
              actions.setCurrentFile({ ...currentFile, name: value })
            }
          ></Input>
        </ModalBody>
        <ModalFooter>
          <Button className="font-normal" variant="text" onPress={handleClose}>
            Close
          </Button>
          <Button
            className="font-normal"
            variant="filledTonal"
            onPress={onCreate}
          >
            Create
          </Button>
        </ModalFooter>
      </>
    )
  }
)
interface DeleteDialogProps {
  queryKey: FileQueryKey
  handleClose: () => void
}
const DeleteDialog = memo(({ handleClose, queryKey }: DeleteDialogProps) => {
  const deleteMutation = useDeleteFile(queryKey)

  const selectedFiles = useModalStore(
    (state) => state.selectedFiles
  ) as string[]

  const onDelete = useCallback(() => {
    deleteMutation.mutate({ files: selectedFiles })
    handleClose()
  }, [])

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Delete Files</ModalHeader>
      <ModalBody>
        <h1 className="text-large font-medium mt-2">
          {`Are you sure to delete ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} ?`}
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
  )
})

export const FileOperationModal = memo(({ queryKey }: FileModalProps) => {
  const { open, operation, actions } = useModalStore(
    useShallow((state) => ({
      open: state.open,
      operation: state.operation,
      actions: state.actions,
    }))
  )

  const handleClose = useCallback(
    () =>
      actions.set({
        open: false,
      }),
    []
  )

  const renderOperation = () => {
    switch (operation) {
      case FbActions.RenameFile.id:
        return <RenameDialog queryKey={queryKey} handleClose={handleClose} />
      case FbActions.CreateFolder.id:
        return (
          <FolderCreateDialog queryKey={queryKey} handleClose={handleClose} />
        )
      case FbActions.DeleteFiles.id:
        return <DeleteDialog queryKey={queryKey} handleClose={handleClose} />
      default:
        return null
    }
  }

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
  )
})
