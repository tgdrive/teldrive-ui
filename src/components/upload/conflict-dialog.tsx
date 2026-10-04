import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@tw-material/react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { FileUploadStatus, useFileUploadStore } from "@/utils/stores";
import type { ConflictChoice } from "@/utils/stores/upload";

export function ConflictDialog() {
  const { conflict, resolveConflict, remaining } = useFileUploadStore(
    useShallow((state) => ({
      conflict: state.conflict,
      resolveConflict: state.actions.resolveConflict,
      remaining: state.filesIds.filter(
        (id) => state.fileMap[id]?.status === FileUploadStatus.NOT_STARTED && !state.fileMap[id]?.isFolder,
      ).length,
    })),
  );
  const [applyToAll, setApplyToAll] = useState(false);

  function choose(choice: ConflictChoice) {
    resolveConflict(choice, applyToAll);
    setApplyToAll(false);
  }

  return (
    <Modal
      isOpen={conflict !== null}
      size="md"
      classNames={{
        wrapper: "overflow-hidden",
        base: "bg-surface w-full shadow-none",
      }}
      placement="center"
      onClose={() => choose("skip")}
      hideCloseButton
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">File already exists</ModalHeader>
        <ModalBody>
          <p className="text-body-medium text-on-surface-variant">
            <span className="text-on-surface font-medium break-all">{conflict?.name}</span>{" "}
            already exists in this folder.
          </p>
          {remaining > 0 && (
            <Checkbox isSelected={applyToAll} onValueChange={setApplyToAll}>
              Do this for all conflicts in this upload
            </Checkbox>
          )}
        </ModalBody>
        <ModalFooter>
          {choices.map(({ choice, label, variant }) => (
            <Button
              key={choice}
              className="font-normal"
              variant={variant}
              onPress={() => choose(choice)}
            >
              {label}
            </Button>
          ))}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const choices = [
  { choice: "skip", label: "Skip", variant: "text" },
  { choice: "rename", label: "Keep both", variant: "text" },
  { choice: "replace", label: "Replace", variant: "filledTonal" },
] as const;
