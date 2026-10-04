import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export enum FileUploadStatus {
  NOT_STARTED = 0,
  UPLOADING = 1,
  UPLOADED = 2,
  CANCELLED = 3,
  FAILED = 4,
  SKIPPED = 5,
}

export type ConflictChoice = "skip" | "replace" | "rename";

export interface UploadConflict {
  fileId: string;
  name: string;
  isFolder: boolean;
}

export interface UploadFile {
  id: string;
  file: File;
  status: FileUploadStatus;
  totalChunks: number;
  controller: AbortController;
  progress: number;
  relativePath?: string;
  parentFolderId?: string;
  isFolder: boolean;
  folderId?: string;
  speed?: number;
  eta?: number;
  chunksCompleted?: number;
  error?: string;
  collapsed?: boolean;
  uploadName?: string;
  conflictAction?: ConflictChoice;
}

import { scanEntries } from "../file-scanner";

export interface UploadState {
  filesIds: string[];
  fileMap: Record<string, UploadFile>;
  currentFileId: string;
  collapse: boolean;
  fileDialogOpen: boolean;
  folderDialogOpen: boolean;
  uploadOpen: boolean;
  conflict: UploadConflict | null;
  batchConflictChoice: ConflictChoice | null;
  actions: {
    addFiles: (files: File[]) => void;
    addFolder: (files: File[], folderName: string) => void;
    handleDragDrop: (items: DataTransferItemList) => Promise<void>;
    handleSelection: (files: FileList | null) => void;
    setCurrentFileId: (id: string) => void;
    toggleCollapse: () => void;
    setFileUploadStatus: (id: string, status: FileUploadStatus) => void;
    removeFile: (id: string) => void;
    cancelUpload: () => void;
    setFileDialogOpen: (open: boolean) => void;
    setFolderDialogOpen: (open: boolean) => void;
    setUploadOpen: (open: boolean) => void;
    setProgress: (id: string, progress: number) => void;
    setSpeed: (id: string, speed: number) => void;
    setETA: (id: string, eta: number) => void;
    setChunksCompleted: (id: string, chunks: number) => void;
    setError: (id: string, error: string) => void;
    setFolderId: (id: string, folderId: string) => void;
    toggleFolderCollapsed: (id: string) => void;
    startNextUpload: () => void;
    clearAll: () => void;
    requestConflictChoice: (conflict: UploadConflict) => Promise<ConflictChoice>;
    resolveConflict: (choice: ConflictChoice, applyToAll: boolean) => void;
    setConflictAction: (id: string, action: ConflictChoice, uploadName?: string) => void;
    retryFailed: () => void;
  };
}

// Resolver for the conflict dialog currently shown; kept outside the store so
// immer never drafts it.
let pendingConflictResolver: ((choice: ConflictChoice) => void) | null = null;

function settleConflict(choice: ConflictChoice) {
  const resolve = pendingConflictResolver;
  pendingConflictResolver = null;
  resolve?.(choice);
}

function nextEligibleFileId(state: UploadState) {
  const eligibleFiles = state.filesIds.filter((id) => {
    const file = state.fileMap[id];
    // Skip if already processed
    if (file.status !== FileUploadStatus.NOT_STARTED) return false;

    // If file has parent folder, check if parent is uploaded/skipped
    if (file.parentFolderId) {
      const parent = state.fileMap[file.parentFolderId];
      return (
        parent &&
        (parent.status === FileUploadStatus.UPLOADED ||
          parent.status === FileUploadStatus.SKIPPED)
      );
    }

    return true; // No dependencies, eligible
  });
  return eligibleFiles[0] || "";
}

export const useFileUploadStore = create<UploadState>()(
  immer((set, get) => ({
    filesIds: [],
    fileMap: {},
    currentFileId: "",
    collapse: false,
    fileDialogOpen: false,
    folderDialogOpen: false,
    uploadOpen: false,
    conflict: null,
    batchConflictChoice: null,
    actions: {
      addFiles: (files: File[]) =>
        set((state) => {
          const newFiles = files.map((file) => ({
            id: Math.random().toString(36).slice(2, 9),
            file,
            status: FileUploadStatus.NOT_STARTED,
            totalChunks: 0,
            controller: new AbortController(),
            progress: 0,
            isFolder: false,
            speed: 0,
            collapsed: false,
          }));

          const ids = newFiles.map((file) => {
            state.fileMap[file.id] = file;
            return file.id;
          });
          state.filesIds.push(...ids);
          if (!state.currentFileId) {
            state.currentFileId = ids[0];
          } else {
            const currentFile = state.fileMap[state.currentFileId];
            // Update currentFileId if current file is not actively uploading
            const isCurrentFileActive =
              currentFile.status === FileUploadStatus.NOT_STARTED ||
              currentFile.status === FileUploadStatus.UPLOADING;
            if (!isCurrentFileActive) {
              state.currentFileId = ids[0];
            }
          }
        }),

      addFolder: (files: File[], folderName: string) =>
        set((state) => {
          const rootFolderId = Math.random().toString(36).slice(2, 9);
          const rootFolderFile = new File([], folderName, { type: "folder" });

          state.fileMap[rootFolderId] = {
            id: rootFolderId,
            file: rootFolderFile,
            status: FileUploadStatus.NOT_STARTED,
            totalChunks: 0,
            controller: new AbortController(),
            progress: 0,
            isFolder: true,
            speed: 0,
            collapsed: false,
            relativePath: folderName,
          };

          state.filesIds.push(rootFolderId);
          const folderPathMap = new Map<string, string>();
          folderPathMap.set(folderName, rootFolderId);

          files.forEach((file) => {
            const pathParts = file.webkitRelativePath.split("/");
            let currentPath = pathParts[0];
            let parentId = rootFolderId;

            // Process intermediate folders
            for (let i = 1; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              currentPath = `${currentPath}/${part}`;

              if (!folderPathMap.has(currentPath)) {
                const folderId = Math.random().toString(36).slice(2, 9);
                const folderFile = new File([], part, { type: "folder" });

                state.fileMap[folderId] = {
                  id: folderId,
                  file: folderFile,
                  status: FileUploadStatus.NOT_STARTED,
                  totalChunks: 0,
                  controller: new AbortController(),
                  progress: 0,
                  isFolder: true,
                  parentFolderId: parentId,
                  speed: 0,
                  collapsed: false,
                  relativePath: currentPath,
                };
                state.filesIds.push(folderId);
                folderPathMap.set(currentPath, folderId);
              }
              parentId = folderPathMap.get(currentPath)!;
            }

            // Create file entry
            const fileId = Math.random().toString(36).slice(2, 9);
            state.fileMap[fileId] = {
              id: fileId,
              file: file,
              status: FileUploadStatus.NOT_STARTED,
              totalChunks: 0,
              controller: new AbortController(),
              progress: 0,
              isFolder: false,
              parentFolderId: parentId,
              relativePath: file.webkitRelativePath,
              speed: 0,
              collapsed: false,
            };
            state.filesIds.push(fileId);
          });

          if (!state.currentFileId) {
            state.currentFileId = rootFolderId;
          }
        }),

      handleDragDrop: async (items: DataTransferItemList) => {
        const rootFiles: File[] = [];
        const folderOperations: Promise<void>[] = [];
        const { addFiles, addFolder, setUploadOpen } = get().actions;

        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (!entry) continue;

          if (entry.isDirectory) {
            folderOperations.push(
              (async () => {
                try {
                  const files = await scanEntries(entry);
                  addFolder(files, entry.name);
                } catch (err) {
                  console.error("Folder processing failed:", err);
                }
              })(),
            );
          } else {
            folderOperations.push(
              (async () => {
                try {
                  const file = await new Promise<File>((resolve, reject) =>
                    (entry as FileSystemFileEntry).file(resolve, reject),
                  );
                  rootFiles.push(file);
                } catch (err) {
                  console.error("File processing failed:", err);
                }
              })(),
            );
          }
        }

        await Promise.all(folderOperations);

        if (rootFiles.length > 0) {
          // Check if any files are already being added (by checking fileMap/ids)
          // or just rely on addFiles to handle it.
          addFiles(rootFiles);
        }

        if (folderOperations.length > 0 || rootFiles.length > 0) {
          setUploadOpen(true);
        }
      },

      handleSelection: (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const { addFolder, addFiles } = get().actions;

        const fileList = Array.from(files);
        const firstFile = fileList[0];
        const relativePath = firstFile?.webkitRelativePath;
        const hasFolderStructure = relativePath && fileList.length > 0;

        if (hasFolderStructure) {
          const pathParts = relativePath.split("/");
          const folderName = pathParts[0] || "Untitled Folder";
          addFolder(fileList, folderName);
        } else {
          const validFiles = fileList.filter((f) => f.size > 0);
          if (validFiles.length > 0) {
            addFiles(validFiles);
          }
        }
      },

      setProgress: (id: string, progress: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].progress = progress;
        }),
      setSpeed: (id: string, speed: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].speed = speed;
        }),
      setETA: (id: string, eta: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].eta = eta;
        }),
      setChunksCompleted: (id: string, chunks: number) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].chunksCompleted = chunks;
        }),
      setError: (id: string, error: string) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].error = error;
        }),
      clearAll: () =>
        set((state) => {
          const completedIds = state.filesIds.filter(
            (id) =>
              state.fileMap[id]?.status === FileUploadStatus.UPLOADED ||
              state.fileMap[id]?.status === FileUploadStatus.CANCELLED ||
              state.fileMap[id]?.status === FileUploadStatus.FAILED ||
              state.fileMap[id]?.status === FileUploadStatus.SKIPPED,
          );
          completedIds.forEach((id) => {
            delete state.fileMap[id];
          });
          state.filesIds = state.filesIds.filter((id) => !completedIds.includes(id));
          if (state.filesIds.length === 0) {
            state.currentFileId = "";
            state.collapse = false;
            state.uploadOpen = false;
            state.batchConflictChoice = null;
          }
        }),
      setFolderId: (id: string, folderId: string) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].folderId = folderId;
        }),
      toggleFolderCollapsed: (id: string) =>
        set((state) => {
          if (state.fileMap[id]?.isFolder) {
            state.fileMap[id].collapsed = !state.fileMap[id].collapsed;
          }
        }),
      setFileUploadStatus: (id: string, status: FileUploadStatus) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].status = status;
        }),
      setFolderDialogOpen: (open: boolean) =>
        set((state) => {
          state.folderDialogOpen = open;
        }),

      setCurrentFileId: (id: string) =>
        set((state) => {
          state.currentFileId = id;
        }),

      removeFile: (id: string) =>
        set((state) => {
          const filesToCancel = [id];
          let i = 0;
          while (i < filesToCancel.length) {
            const currentId = filesToCancel[i];
            const file = state.fileMap[currentId];
            if (file?.isFolder) {
              const children = state.filesIds.filter(
                (fid) => state.fileMap[fid]?.parentFolderId === currentId,
              );
              filesToCancel.push(...children);
            }
            i++;
          }

          const isCurrentFileCancelled = filesToCancel.includes(state.currentFileId);

          if (state.conflict && filesToCancel.includes(state.conflict.fileId)) {
            state.conflict = null;
            settleConflict("skip");
          }

          filesToCancel.forEach((cancelId) => {
            const file = state.fileMap[cancelId];
            if (file) {
              if (file.controller && file.status !== FileUploadStatus.CANCELLED) {
                file.controller.abort();
              }
              file.status = FileUploadStatus.CANCELLED;
            }
          });

          if (state.filesIds.length === 0) {
            state.currentFileId = "";
            state.collapse = false;
            state.uploadOpen = false;
            state.fileDialogOpen = false;
            state.folderDialogOpen = false;
          } else if (isCurrentFileCancelled) {
            state.currentFileId = nextEligibleFileId(state);
          }
        }),

      cancelUpload: () =>
        set((state) => {
          const file = state.fileMap[state.currentFileId];
          if (file?.controller) {
            file.controller.abort();
          }
          state.fileMap = {};
          state.filesIds = [];
          state.currentFileId = "";
          state.collapse = false;
          state.uploadOpen = false;
          state.fileDialogOpen = false;
          state.folderDialogOpen = false;
          state.conflict = null;
          state.batchConflictChoice = null;
          settleConflict("skip");
        }),
      toggleCollapse: () =>
        set((state) => {
          state.collapse = !state.collapse;
        }),
      setFileDialogOpen: (open: boolean) =>
        set((state) => {
          state.fileDialogOpen = open;
        }),
      setUploadOpen: (open: boolean) =>
        set((state) => {
          state.uploadOpen = open;
        }),
      startNextUpload: () =>
        set((state) => {
          state.currentFileId = nextEligibleFileId(state);
          // An "apply to all" choice only lasts for the batch it was made in
          if (!state.currentFileId) state.batchConflictChoice = null;
        }),

      requestConflictChoice: (conflict: UploadConflict) => {
        const { batchConflictChoice } = get();
        if (batchConflictChoice) return Promise.resolve(batchConflictChoice);
        settleConflict("skip");
        return new Promise<ConflictChoice>((resolve) => {
          pendingConflictResolver = resolve;
          set((state) => {
            state.conflict = conflict;
          });
        });
      },

      resolveConflict: (choice: ConflictChoice, applyToAll: boolean) => {
        set((state) => {
          state.conflict = null;
          if (applyToAll) state.batchConflictChoice = choice;
        });
        settleConflict(choice);
      },

      setConflictAction: (id: string, action: ConflictChoice, uploadName?: string) =>
        set((state) => {
          if (!state.fileMap[id]) return;
          state.fileMap[id].conflictAction = action;
          state.fileMap[id].uploadName = uploadName;
        }),

      retryFailed: () =>
        set((state) => {
          for (const id of state.filesIds) {
            const file = state.fileMap[id];
            if (file.status !== FileUploadStatus.FAILED) continue;
            file.status = FileUploadStatus.NOT_STARTED;
            file.controller = new AbortController();
            file.progress = 0;
            file.chunksCompleted = 0;
            file.error = undefined;
            file.conflictAction = undefined;
            file.uploadName = undefined;
          }
          // Restart the queue unless a file is still in flight
          const current = state.fileMap[state.currentFileId];
          if (current?.status !== FileUploadStatus.UPLOADING)
            state.currentFileId = nextEligibleFileId(state);
        }),
    },
  })),
);
