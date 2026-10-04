import { useQueryClient } from "@tanstack/react-query";
import { Button, Listbox, ListboxItem } from "@tw-material/react";
import clsx from "clsx";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import IconParkOutlineCloseOne from "~icons/icon-park-outline/close-one";
import IconParkOutlineDownC from "~icons/icon-park-outline/down-c";

import { $api, fetchClient } from "@/utils/api";
import { filesize } from "@/utils/common";
import { useSession } from "@/utils/query-options";
import { FileUploadStatus, useFileUploadStore } from "@/utils/stores";
import type { ConflictChoice, UploadFile } from "@/utils/stores/upload";
import { useSettingsStore } from "@/utils/stores/settings";
import { useSearch } from "@tanstack/react-router";
import { ConflictDialog } from "./conflict-dialog";
import type { UploadProps } from "./types";
import { findExisting, nextAvailableName, uploadFile } from "./upload-file";
import { UploadFileEntry } from "./upload-file-entry";

export const Upload = ({ queryKey }: UploadProps) => {
  const {
    fileIds,
    currentFile,
    collapse,
    fileDialogOpen,
    folderDialogOpen,
    actions,
    fileMap,
  } = useFileUploadStore(
    useShallow((state) => ({
      fileIds: state.filesIds,
      fileMap: state.fileMap,
      currentFile: state.fileMap[state.currentFileId],
      collapse: state.collapse,
      actions: state.actions,
      fileDialogOpen: state.fileDialogOpen,
      folderDialogOpen: state.folderDialogOpen,
    })),
  );

  const isDialogOpening = useRef(false);

  const uploadSummary = useMemo(() => {
    const topLevelIds = fileIds.filter((id) => {
      const file = fileMap[id];
      if (!file) return false;
      const isChildFile =
        file.parentFolderId && fileIds.includes(file.parentFolderId);
      return !isChildFile;
    });

    // Filter out cancelled, failed, and skipped files from progress calculations
    const validFileIds = fileIds.filter((id) => {
      const status = fileMap[id]?.status;
      return (
        status !== FileUploadStatus.CANCELLED &&
        status !== FileUploadStatus.FAILED &&
        status !== FileUploadStatus.SKIPPED
      );
    });

    const validTopLevelIds = topLevelIds.filter((id) => {
      const status = fileMap[id]?.status;
      return (
        status !== FileUploadStatus.CANCELLED &&
        status !== FileUploadStatus.FAILED &&
        status !== FileUploadStatus.SKIPPED
      );
    });

    const folders = validTopLevelIds.filter(
      (id) => fileMap[id]?.isFolder,
    ).length;
    const files = validTopLevelIds.filter(
      (id) => !fileMap[id]?.isFolder,
    ).length;

    const totalSize = validFileIds.reduce(
      (sum, id) => sum + (fileMap[id]?.file.size || 0),
      0,
    );
    const uploadedSize = validFileIds.reduce((sum, id) => {
      const file = fileMap[id];
      // For uploaded files, count as 100% progress
      const progress =
        file?.status === FileUploadStatus.UPLOADED ? 100 : file?.progress || 0;
      return sum + (progress / 100) * (file?.file.size || 0);
    }, 0);

    const totalProgress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0;

    const report = { uploaded: 0, replaced: 0, renamed: 0, skipped: 0, failed: 0 };
    let isDone = true;
    for (const id of fileIds) {
      const file = fileMap[id];
      if (!file) continue;
      if (
        file.status === FileUploadStatus.NOT_STARTED ||
        file.status === FileUploadStatus.UPLOADING
      )
        isDone = false;
      if (file.status === FileUploadStatus.FAILED) report.failed++;
      if (file.isFolder) continue;
      if (file.status === FileUploadStatus.SKIPPED) report.skipped++;
      if (file.status !== FileUploadStatus.UPLOADED) continue;
      if (file.conflictAction === "replace") report.replaced++;
      else if (file.conflictAction === "rename") report.renamed++;
      else report.uploaded++;
    }

    return {
      folders,
      files,
      totalProgress,
      totalSize,
      uploadedSize,
      report,
      isDone,
    };
  }, [fileIds, fileMap]);

  const topLevelFileIds = useMemo(() => {
    return fileIds.filter((id) => {
      const file = fileMap[id];
      if (!file) return false;
      const isChildFile =
        file.parentFolderId && fileIds.includes(file.parentFolderId);
      return !isChildFile;
    });
  }, [fileIds, fileMap]);

  const { settings } = useSettingsStore();

  const [session] = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const openFileSelector = useCallback(() => {
    if (!isDialogOpening.current) {
      isDialogOpening.current = true;
      fileInputRef?.current?.click();
      setTimeout(() => {
        isDialogOpening.current = false;
      }, 200);
    }
  }, []);

  const openFolderSelector = useCallback(() => {
    if (!isDialogOpening.current) {
      isDialogOpening.current = true;
      folderInputRef?.current?.click();
      setTimeout(() => {
        isDialogOpening.current = false;
      }, 200);
    }
  }, []);

  useEffect(() => {
    const handleFileSelect = () => {
      actions.setFileDialogOpen(false);
    };

    if (fileDialogOpen) {
      openFileSelector();
      fileInputRef.current?.addEventListener("change", handleFileSelect, {
        once: true,
      });
    }

    return () => {
      fileInputRef.current?.removeEventListener("change", handleFileSelect);
    };
  }, [fileDialogOpen, actions]);

  useEffect(() => {
    const handleFolderSelect = () => {
      actions.setFolderDialogOpen(false);
    };

    if (folderDialogOpen) {
      openFolderSelector();
      folderInputRef.current?.addEventListener("change", handleFolderSelect, {
        once: true,
      });
    }

    return () => {
      folderInputRef.current?.removeEventListener("change", handleFolderSelect);
    };
  }, [folderDialogOpen, actions]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      actions.handleSelection(event.target.files);
      event.target.value = "";
    },
    [actions],
  );

  const handleFolderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      actions.handleSelection(event.target.files);
      event.target.value = "";
    },
    [actions],
  );

  const queryClient = useQueryClient();

  const creatFile = $api.useMutation("post", "/files", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const { path } = useSearch({ from: "/_authed/$view" });

  useEffect(() => {
    if (
      !currentFile?.id ||
      currentFile.status !== FileUploadStatus.NOT_STARTED
    )
      return;

    actions.setFileUploadStatus(currentFile.id, FileUploadStatus.UPLOADING);

    const uploadPath = currentFile.relativePath?.includes("/")
      ? `${path || "/"}/${currentFile.relativePath.split("/").slice(0, -1).join("/")}`
      : path || "/";

    const upload = currentFile.isFolder
      ? createFolder(currentFile, uploadPath)
      : uploadOne(currentFile, uploadPath);

    upload
      .catch((error) => {
        if (error instanceof Error && error.message.includes("aborted")) {
          actions.setFileUploadStatus(currentFile.id, FileUploadStatus.CANCELLED);
          return;
        }
        actions.setError(
          currentFile.id,
          error instanceof Error ? error.message : "upload failed",
        );
        actions.setFileUploadStatus(currentFile.id, FileUploadStatus.FAILED);
      })
      // One failed file must never stall the rest of the batch
      .finally(() => actions.startNextUpload());
  }, [currentFile?.id, currentFile?.status]);

  async function createFolder(folder: UploadFile, uploadPath: string) {
    const existing = await findExisting(uploadPath, folder.file.name);
    // Uploading into an existing folder merges into it; only a file with the
    // same name is a real conflict, since creating would overwrite that file.
    if (existing && existing.type !== "folder")
      throw new Error(`a file named "${folder.file.name}" already exists here`);
    if (!existing)
      await creatFile.mutateAsync({
        body: { name: folder.file.name, type: "folder", path: uploadPath },
      });
    actions.setFileUploadStatus(folder.id, FileUploadStatus.UPLOADED);
  }

  async function uploadOne(file: UploadFile, uploadPath: string) {
    const existing = await findExisting(uploadPath, file.file.name);
    let fileName = file.file.name;
    let replaceId: string | undefined;

    if (existing) {
      let choice = await chooseConflictAction(file);
      if (file.controller.signal.aborted) throw new Error("upload aborted");
      // Never delete a folder to make room for a file
      if (choice === "replace" && existing.type === "folder") choice = "rename";

      if (choice === "skip") {
        actions.setConflictAction(file.id, "skip");
        actions.setFileUploadStatus(file.id, FileUploadStatus.SKIPPED);
        return;
      }
      if (choice === "rename") fileName = await nextAvailableName(uploadPath, fileName);
      if (choice === "replace") replaceId = existing.id;
      actions.setConflictAction(file.id, choice, fileName);
    }

    await uploadFile(
      file.file,
      uploadPath,
      Number(settings.splitFileSize),
      session?.userId as number,
      Number(settings.uploadConcurrency),
      Number(settings.uploadRetries),
      Number(settings.uploadRetryDelay),
      Boolean(settings.encryptFiles),
      Boolean(settings.randomChunking),
      file.controller.signal,
      (progress) => actions.setProgress(file.id, progress),
      (chunks) => actions.setChunksCompleted(file.id, chunks),
      async (payload) => {
        // Delete first so the old file's parts are cleaned up; creating over it
        // would overwrite the record in place and orphan them.
        if (replaceId)
          await fetchClient.POST("/files/delete", { body: { ids: [replaceId] } });
        await creatFile.mutateAsync({ body: payload });
      },
      fileName,
    );
    actions.setFileUploadStatus(file.id, FileUploadStatus.UPLOADED);
  }

  function chooseConflictAction(file: UploadFile): Promise<ConflictChoice> {
    const policy = settings.uploadConflictPolicy;
    if (policy === "skip" || policy === "replace" || policy === "rename")
      return Promise.resolve(policy);
    return actions.requestConflictChoice({
      fileId: file.id,
      name: file.file.name,
      isFolder: false,
    });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <input
        className="opacity-0 size-0"
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
      />
      <input
        className="opacity-0 size-0"
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: "" } as any)}
        onChange={handleFolderChange}
      />
      {fileIds.length > 0 && (
        <div className="relative w-96 shadow-2xl rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant/10">
          <div
            className={clsx(
              "transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
              collapse ? "translate-y-0" : "translate-y-0",
            )}
          >
            <div
              className={clsx(
                "relative overflow-hidden transition-colors duration-300",
                collapse
                  ? "bg-surface-container-high"
                  : "bg-surface-container-highest",
              )}
            >
              <div className="h-[3px] w-full bg-primary/10 relative overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{ width: `${uploadSummary.totalProgress}%` }}
                />
              </div>
              <div className="flex items-center px-4 py-2.5 justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-label-large text-on-surface">
                    {uploadSummary.isDone ? "Upload complete" : "Uploading..."}
                  </span>
                  {!uploadSummary.isDone && uploadSummary.totalSize > 0 && (
                    <span className="text-label-medium text-on-surface-variant">
                      {filesize(uploadSummary.uploadedSize)} of{" "}
                      {filesize(uploadSummary.totalSize)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {uploadSummary.report.failed > 0 && (
                    <Button
                      variant="text"
                      className="text-primary h-8 min-w-0 px-3"
                      onPress={actions.retryFailed}
                    >
                      Retry failed
                    </Button>
                  )}
                  <Button
                    variant="text"
                    className="text-on-surface-variant size-8 min-w-8 p-0"
                    isIconOnly
                    onPress={actions.toggleCollapse}
                  >
                    <IconParkOutlineDownC
                      className={clsx(
                        "size-5 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                        collapse ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </Button>
                  <Button
                    variant="text"
                    className="text-on-surface-variant size-8 min-w-8 p-0"
                    isIconOnly
                    onPress={actions.cancelUpload}
                  >
                    <IconParkOutlineCloseOne className="size-5" />
                  </Button>
                </div>
              </div>
              {uploadSummary.isDone && (
                <UploadReport report={uploadSummary.report} />
              )}
            </div>
            <div
              className={clsx(
                "bg-surface-container-low overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                collapse
                  ? "opacity-0 scale-95 pointer-events-none h-0"
                  : "opacity-100 scale-100 pointer-events-auto max-h-96 overflow-y-auto",
                "scrollbar-thin scrollbar-thumb-outline-variant scrollbar-track-transparent",
              )}
            >
              <div className="px-2 py-2">
                <Listbox
                  aria-label="Upload Files"
                  isVirtualized={fileIds.length > 100}
                  className="select-none gap-1"
                >
                  {topLevelFileIds.map((id) => (
                    <ListboxItem
                      className="data-[hover=true]:bg-transparent px-0"
                      key={id}
                      textValue={id}
                    >
                      <UploadFileEntry
                        id={id}
                        chunkSize={Number(settings.splitFileSize)}
                        fileIds={fileIds}
                      />
                    </ListboxItem>
                  ))}
                </Listbox>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConflictDialog />
    </div>
  );
};

function UploadReport({ report }: { report: UploadReportCounts }) {
  const parts = reportLabels
    .filter(({ key }) => report[key] > 0)
    .map(({ key, label }) => `${report[key]} ${label}`);
  if (parts.length === 0) return null;
  return (
    <div className="px-4 pb-2.5 -mt-1 text-body-small text-on-surface-variant">
      {parts.join(" · ")}
    </div>
  );
}

const reportLabels = [
  { key: "uploaded", label: "uploaded" },
  { key: "replaced", label: "replaced" },
  { key: "renamed", label: "kept both" },
  { key: "skipped", label: "skipped" },
  { key: "failed", label: "failed" },
] as const;

interface UploadReportCounts {
  uploaded: number;
  replaced: number;
  renamed: number;
  skipped: number;
  failed: number;
}
