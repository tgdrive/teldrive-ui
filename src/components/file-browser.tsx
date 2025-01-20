import { memo, useEffect, useMemo, useRef } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import {
  FbActions,
  FileBrowser,
  FileContextMenu,
  FileList,
  FileNavbar,
  FileToolbar,
} from "@tw-material/file-browser";
import type { StateSnapshot, VirtuosoGridHandle, VirtuosoHandle } from "react-virtuoso";
import useBreakpoint from "use-breakpoint";

import { fileActions, useFileAction } from "@/hooks/use-file-action";
import { chainLinks } from "@/utils/common";
import { BREAKPOINTS, defaultSortState, defaultViewId, sortViewMap } from "@/utils/defaults";
import { fileQueries } from "@/utils/query-options";

import { FileOperationModal } from "./modals/file-operation";
import PreviewModal from "./modals/preview";
import type { BrowseView, FileListParams } from "@/types";
import { useModalStore } from "@/utils/stores/modal";

let firstRender = true;

function isVirtuosoList(value: any): value is VirtuosoHandle {
  return (value as VirtuosoHandle).getState !== undefined;
}

const modalFileActions = [
  FbActions.RenameFile.id,
  FbActions.CreateFolder.id,
  FbActions.DeleteFiles.id,
];

const fileRoute = getRouteApi("/_authed/$view");

const positions = new Map<string, StateSnapshot>();

export const DriveFileBrowser = memo(() => {
  const { view } = fileRoute.useParams();

  const search = fileRoute.useSearch();

  const listRef = useRef<VirtuosoHandle | VirtuosoGridHandle>(null);

  const queryParams: FileListParams = {
    view: view as BrowseView,
    params: search,
  };
  const queryOptions = fileQueries.list(queryParams);

  const modalOpen = useModalStore((state) => state.open);

  const modalOperation = useModalStore((state) => state.operation);

  const { breakpoint } = useBreakpoint(BREAKPOINTS);

  const {
    data: files,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery(queryOptions);

  const actionHandler = useFileAction(queryParams);

  const folderChain = useMemo(() => {
    if (view === "my-drive") {
      return chainLinks(search?.path || "").map(([name, path], index) => ({
        id: index + name,
        name,
        path,
        isDir: true,
        chain: true,
      }));
    }

    return [];
  }, [search?.path, view]);

  useEffect(() => {
    if (firstRender) {
      firstRender = false;
      return;
    }

    setTimeout(() => {
      listRef.current?.scrollTo({
        top: positions.get(view + search?.path || "")?.scrollTop ?? 0,
        left: 0,
      });
    }, 0);

    return () => {
      if (listRef.current && isVirtuosoList(listRef.current)) {
        listRef.current?.getState((state) => positions.set(view + search?.path || "", state));
      }
    };
  }, [search?.path, view]);

  return (
    <div className="size-full m-auto">
      <FileBrowser
        files={files}
        folderChain={folderChain}
        onFileAction={actionHandler()}
        fileActions={fileActions}
        defaultFileViewActionId={defaultViewId}
        defaultSortActionId={
          view === "my-drive" ? defaultSortState.sortId : sortViewMap[view].sortId
        }
        defaultSortOrder={view === "my-drive" ? defaultSortState.order : sortViewMap[view].order}
        breakpoint={breakpoint}
      >
        {view === "my-drive" && <FileNavbar breakpoint={breakpoint} />}
        <FileToolbar className={view !== "my-drive" ? "pt-2" : ""} />
        <FileList
          hasNextPage={hasNextPage}
          isNextPageLoading={isFetchingNextPage}
          loadNextPage={fetchNextPage}
          ref={listRef}
        />
        <FileContextMenu />
      </FileBrowser>

      {modalFileActions.find((val) => val === modalOperation) && modalOpen && (
        <FileOperationModal queryKey={queryOptions.queryKey} />
      )}

      {modalOperation === FbActions.OpenFiles.id && modalOpen && (
        <PreviewModal files={files} path={search?.path || ""} view={view as BrowseView} />
      )}
    </div>
  );
});
