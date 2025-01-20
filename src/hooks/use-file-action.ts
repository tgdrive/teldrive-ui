import { useCallback } from "react";
import type { FileListParams } from "@/types";
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

import { mediaUrl, navigateToExternalUrl } from "@/utils/common";
import { getSortState, SortOrder } from "@/utils/defaults";
import { useModalStore } from "@/utils/stores";
import { useNavigate } from "@tanstack/react-router";
import { $api } from "@/utils/api";

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

export const useFileAction = ({ view, params: search }: FileListParams) => {
  const queryClient = useQueryClient();

  const actions = useModalStore((state) => state.actions);

  const navigate = useNavigate();

  const moveFiles = $api.useMutation("post", "/files/move");

  return useCallback(() => {
    return async (data: MapFileActionsToData<FbActionFullUnion>) => {
      switch (data.id) {
        case FbActions.OpenFiles.id: {
          const { targetFile, files } = data.payload;

          const fileToOpen = targetFile ?? files[0];

          if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
            let qparams: FileListParams;

            if (view === "my-drive") {
              const basePath = search?.path ?? "/";
              qparams = {
                view,
                params: {
                  path: fileToOpen.chain
                    ? fileToOpen.path
                    : `${basePath === "/" ? "" : basePath}/${fileToOpen.name}`,
                },
              };
            } else {
              qparams = {
                view: "browse",
                params: { parentId: fileToOpen.id },
              };
            }
            navigate({ to: "/$view", params: { view: qparams.view }, search: qparams.params });
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
              const url = mediaUrl(id, name, search?.path || "", true);
              navigateToExternalUrl(url, false);
            }
          }
          break;
        }
        case CustomActions.OpenInVLCPlayer.id: {
          const { selectedFiles } = data.state;
          const fileToOpen = selectedFiles[0];
          const { id, name } = fileToOpen!;
          const url = `vlc://${mediaUrl(id, name, search?.path || "")}`;
          navigateToExternalUrl(url, false);
          break;
        }
        case CustomActions.OpenInPotPlayer.id: {
          const { selectedFiles } = data.state;
          const fileToOpen = selectedFiles[0];
          const { id, name } = fileToOpen!;
          const url = `potplayer://${mediaUrl(id, name, search?.path || "")}`;
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

        case CustomActions.CopyDownloadLink.id: {
          const selections = data.state.selectedFilesForAction;
          const clipboardText = selections
            .filter((element) => !FileHelper.isDirectory(element))
            .map(({ id, name }) => mediaUrl(id, name, search?.path || "", true))
            .join("\n");
          navigator.clipboard.writeText(clipboardText);
          break;
        }
        case FbActions.MoveFiles.id: {
          const { files, target } = data.payload;
          moveFiles
            .mutateAsync({
              body: {
                ids: files.map((file) => file?.id!),
                destination: target.path || "/",
              },
            })
            .then(() => {
              toast.success(`${files.length} files moved successfully`);
              queryClient.invalidateQueries({
                queryKey: ["Files_list", "my-drive"],
              });
            });

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

export const fileActions = Object.keys(CustomActions).map(
  (t) => CustomActions[t as keyof typeof CustomActions],
);
