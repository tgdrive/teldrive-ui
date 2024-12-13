import { useCallback } from "react";
import type { QueryParams, Session, ShareQueryParams } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  defineFileAction,
  FbActions,
  type FbActionUnion,
  FbIconName,
  FileHelper,
  type MapFileActionsToData,
  type FileData,
} from "@tw-material/file-browser";
import IconFlatColorIconsVlc from "~icons/flat-color-icons/vlc";
import IconPotPlayerIcon from "~icons/material-symbols/play-circle-rounded";
import toast from "react-hot-toast";

import { mediaUrl, navigateToExternalUrl, sharedMediaUrl } from "@/utils/common";
import { getSortState, SortOrder } from "@/utils/defaults";
import http from "@/utils/http";
import { useFileUploadStore, useModalStore } from "@/utils/stores";
import Share from "~icons/fluent/share-24-regular";
import { useNavigate } from "@tanstack/react-router";

export const CustomActions = {
  OpenInVLCPlayer: defineFileAction({
    id: "open_vlc_player",
    requiresSelection: true,
    fileFilter: (file) => file?.previewType === "video",
    button: {
      name: "VLC",
      toolbar: true,
      group: "OpenOptions",
      icon: IconFlatColorIconsVlc,
    },
  } as const),
  OpenInPotPlayer: defineFileAction({
    id: "open_pot_player",
    requiresSelection: true,
    fileFilter: (file) => file?.previewType === "video",
    button: {
      name: "PotPlayer",
      toolbar: true,
      group: "OpenOptions",
      icon: IconPotPlayerIcon,
    },
  } as const),
  ShareFiles: defineFileAction({
    id: "share_files",
    requiresSelection: true,
    button: {
      name: "Share",
      contextMenu: true,
      icon: Share,
    },
  } as const),

  CopyDownloadLink: defineFileAction({
    id: "copy_link",
    requiresSelection: true,
    fileFilter: (file) => !(file && "isDir" in file),
    button: {
      name: "Copy Link",
      contextMenu: true,
      icon: FbIconName.copy,
    },
  } as const),
};

type FbActionFullUnion = (typeof CustomActions)[keyof typeof CustomActions] | FbActionUnion;

export const useFileAction = ({ view, search }: QueryParams, session: Session) => {
  const queryClient = useQueryClient();

  const actions = useModalStore((state) => state.actions);

  const fileDialogOpen = useFileUploadStore((state) => state.actions.setFileDialogOpen);

  const uploadOpen = useFileUploadStore((state) => state.actions.setUploadOpen);
  const navigate = useNavigate();

  return useCallback(() => {
    return async (data: MapFileActionsToData<FbActionFullUnion>) => {
      switch (data.id) {
        case FbActions.OpenFiles.id: {
          const { targetFile, files } = data.payload;

          const fileToOpen = targetFile ?? files[0];

          if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
            let qparams: QueryParams;

            if (view === "my-drive") {
              const basePath = search?.path ?? "/";
              qparams = {
                view,
                search: {
                  path: fileToOpen.chain
                    ? fileToOpen.path
                    : `${basePath === "/" ? "" : basePath}/${fileToOpen.name}`,
                },
              };
            } else {
              qparams = {
                view: "browse",
                search: { parentId: fileToOpen.id },
              };
            }
            navigate({ to: "/$view", params: { view: qparams.view }, search: qparams.search });
          } else if (fileToOpen && FileHelper.isOpenable(fileToOpen)) {
            actions.set({
              open: true,
              currentFile: fileToOpen,
              operation: FbActions.OpenFiles.id,
            });
          }

          break;
        }
        case FbActions.DownloadFiles.id: {
          const { selectedFiles } = data.state;
          for (const file of selectedFiles) {
            if (!FileHelper.isDirectory(file)) {
              const { id, name } = file;
              const url = mediaUrl(id, name, search?.path || "", session.hash, true);
              navigateToExternalUrl(url, false);
            }
          }
          break;
        }
        case CustomActions.OpenInVLCPlayer.id: {
          const { selectedFiles } = data.state;
          const fileToOpen = selectedFiles[0];
          const { id, name } = fileToOpen;
          const url = `vlc://${mediaUrl(id, name, search?.path || "", session.hash)}`;
          navigateToExternalUrl(url, false);
          break;
        }
        case CustomActions.OpenInPotPlayer.id: {
          const { selectedFiles } = data.state;
          const fileToOpen = selectedFiles[0];
          const { id, name } = fileToOpen;
          const url = `potplayer://${mediaUrl(id, name, search?.path || "", session.hash)}`;
          navigateToExternalUrl(url, false);
          break;
        }
        case FbActions.RenameFile.id: {
          actions.set({
            open: true,
            currentFile: data.state.selectedFiles[0],
            operation: FbActions.RenameFile.id,
          });
          break;
        }
        case FbActions.DeleteFiles.id: {
          actions.set({
            open: true,
            selectedFiles: data.state.selectedFiles.map((item) => item.id),
            operation: FbActions.DeleteFiles.id,
          });
          break;
        }
        case FbActions.CreateFolder.id: {
          actions.set({
            open: true,
            operation: FbActions.CreateFolder.id,
            currentFile: {} as FileData,
          });
          break;
        }

        case CustomActions.ShareFiles.id: {
          actions.set({
            open: true,
            operation: CustomActions.ShareFiles.id,
            currentFile: data.state.selectedFiles[0],
          });
          break;
        }

        case CustomActions.CopyDownloadLink.id: {
          const selections = data.state.selectedFilesForAction;
          const clipboardText = selections
            .filter((element) => !FileHelper.isDirectory(element))
            .map(({ id, name }) => mediaUrl(id, name, search?.path || "", session.hash, true))
            .join("\n");
          navigator.clipboard.writeText(clipboardText);
          break;
        }
        case FbActions.MoveFiles.id: {
          const { files, target } = data.payload;
          const res = await http.post("/api/files/move", {
            files: files.map((file) => file?.id),
            destination: target.path || "/",
          });
          if (res.status === 200) {
            toast.success(`${files.length} files moved successfully`);
            queryClient.invalidateQueries({
              queryKey: ["files"],
            });
          }
          break;
        }

        case FbActions.UploadFiles.id: {
          fileDialogOpen(true);
          uploadOpen(true);
          break;
        }

        case FbActions.EnableListView.id:
        case FbActions.EnableGridView.id:
        case FbActions.EnableTileView.id: {
          localStorage.setItem("viewId", data.id);
          break;
        }
        case FbActions.SortFilesByName.id:
        case FbActions.SortFilesBySize.id:
        case FbActions.SortFilesByDate.id: {
          if (view === "my-drive") {
            const currentSortState = getSortState();
            const order = currentSortState.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
            localStorage.setItem("sort", JSON.stringify({ sortId: data.id, order }));
          }
          break;
        }
        default:
          break;
      }
    };
  }, [view, search?.path]);
};

export const useShareFileAction = (params: ShareQueryParams) => {
  const actions = useModalStore((state) => state.actions);
  const navigate = useNavigate();
  return useCallback(() => {
    return async (data: MapFileActionsToData<FbActionFullUnion>) => {
      switch (data.id) {
        case FbActions.OpenFiles.id: {
          const { targetFile, files } = data.payload;

          const fileToOpen = targetFile ?? files[0];

          if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
            const basePath = params?.path ?? "/";
            navigate({
              to: "/share/$id",
              params: {
                id: params.id,
              },
              search: {
                path: fileToOpen.chain
                  ? fileToOpen.path
                  : `${basePath === "/" ? "" : basePath}/${fileToOpen.name}`,
              },
            });
          } else if (fileToOpen && FileHelper.isOpenable(fileToOpen)) {
            actions.set({
              open: true,
              currentFile: fileToOpen,
              operation: FbActions.OpenFiles.id,
            });
          }

          break;
        }
        case FbActions.DownloadFiles.id: {
          const { selectedFiles } = data.state;
          for (const file of selectedFiles) {
            if (!FileHelper.isDirectory(file)) {
              const { id, name } = file;
              const url = sharedMediaUrl(params.id, id, name, true);
              navigateToExternalUrl(url, false);
            }
          }
          break;
        }
        case CustomActions.OpenInVLCPlayer.id: {
          const { selectedFiles } = data.state;
          const fileToOpen = selectedFiles[0];
          const { id, name } = fileToOpen;
          const url = `vlc://${sharedMediaUrl(params.id, id, name)}`;
          navigateToExternalUrl(url, false);
          break;
        }
        case CustomActions.OpenInPotPlayer.id: {
          const { selectedFiles } = data.state;
          const fileToOpen = selectedFiles[0];
          const { id, name } = fileToOpen;
          const url = `potplayer://${sharedMediaUrl(params.id, id, name)}`;
          navigateToExternalUrl(url, false);
          break;
        }

        case CustomActions.CopyDownloadLink.id: {
          const selections = data.state.selectedFilesForAction;
          const clipboardText = selections
            .filter((element) => !FileHelper.isDirectory(element))
            .map(({ id, name }) => sharedMediaUrl(params.id, id, name, true))
            .join("\n");
          navigator.clipboard.writeText(clipboardText);
          break;
        }

        case FbActions.EnableListView.id:
        case FbActions.EnableGridView.id:
        case FbActions.EnableTileView.id: {
          localStorage.setItem("viewId", data.id);
          break;
        }
        default:
          break;
      }
    };
  }, [params.path, params.id]);
};

export const fileActions = Object.keys(CustomActions).map(
  (t) => CustomActions[t as keyof typeof CustomActions],
);

export const sharefileActions = Object.keys(CustomActions)
  .map((t) => CustomActions[t as keyof typeof CustomActions])
  .filter((action) => action.id !== CustomActions.ShareFiles.id);
