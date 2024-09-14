import { memo, useEffect, useMemo, useRef } from "react";
import { useQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
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

import { CustomActions, fileActions, useFileAction } from "@/hooks/useFileAction";
import { chainLinks, isMobile } from "@/utils/common";
import { BREAKPOINTS, defaultSortState, defaultViewId, sortViewMap } from "@/utils/defaults";
import { fileQueries, userQueries } from "@/utils/queryOptions";
import { useFileUploadStore, useModalStore } from "@/utils/stores";

import { FileOperationModal } from "./modals/FileOperation";
import PreviewModal from "./modals/Preview";
import { Upload } from "./Upload";

let firstRender = true;

function isVirtuosoList(value: any): value is VirtuosoHandle {
  return (value as VirtuosoHandle).getState !== undefined;
}

const modalFileActions = [
  FbActions.RenameFile.id,
  FbActions.CreateFolder.id,
  FbActions.DeleteFiles.id,
  CustomActions.ShareFiles.id,
];

const fileRoute = getRouteApi("/_authenticated/$");

const positions = new Map<string, StateSnapshot>();

export const DriveFileBrowser = memo(() => {
  const { queryParams: params } = fileRoute.useRouteContext();

  const search = fileRoute.useSearch();

  const listRef = useRef<VirtuosoHandle | VirtuosoGridHandle>(null);

  const { data: session } = useQuery(userQueries.session());

  const queryOptions = fileQueries.list(
    Object.keys(search).length > 0 ? { ...params, filter: search } : params,
    session?.hash!,
  );

  const modalOpen = useModalStore((state) => state.open);

  const modalOperation = useModalStore((state) => state.operation);

  const openUpload = useFileUploadStore((state) => state.uploadOpen);

  const { breakpoint } = useBreakpoint(BREAKPOINTS);

  const {
    data: files,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuspenseInfiniteQuery(queryOptions);

  const actionHandler = useFileAction(params, session!);

  const folderChain = useMemo(() => {
    if (params.type === "my-drive") {
      return chainLinks(params.path).map(([name, path], index) => ({
        id: index + name,
        name,
        path,
        isDir: true,
        chain: true,
      }));
    }

    return [];
  }, [params.path, params.type]);

  useEffect(() => {
    if (firstRender) {
      firstRender = false;
      return;
    }

    setTimeout(() => {
      listRef.current?.scrollTo({
        top: positions.get(params.type + params.path)?.scrollTop ?? 0,
        left: 0,
      });
    }, 0);

    return () => {
      if (listRef.current && isVirtuosoList(listRef.current)) {
        listRef.current?.getState((state) => positions.set(params.type + params.path, state));
      }
    };
  }, [params.path, params.type]);

  return (
    <div className="size-full m-auto">
      <FileBrowser
        files={files}
        folderChain={folderChain}
        onFileAction={actionHandler()}
        fileActions={fileActions}
        defaultFileViewActionId={defaultViewId}
        defaultSortActionId={
          params.type === "my-drive" ? defaultSortState.sortId : sortViewMap[params.type].sortId
        }
        defaultSortOrder={
          params.type === "my-drive" ? defaultSortState.order : sortViewMap[params.type].order
        }
        breakpoint={breakpoint}
      >
        {params.type === "my-drive" && <FileNavbar breakpoint={breakpoint} />}
        <FileToolbar className={params.type !== "my-drive" ? "pt-2" : ""} />
        <FileList
          hasNextPage={hasNextPage}
          isNextPageLoading={isFetchingNextPage}
          loadNextPage={fetchNextPage}
          ref={listRef}
        />
        {!isMobile && <FileContextMenu />}
      </FileBrowser>

      {modalFileActions.find((val) => val === modalOperation) && modalOpen && (
        <FileOperationModal queryKey={queryOptions.queryKey} />
      )}

      {modalOperation === FbActions.OpenFiles.id && modalOpen && (
        <PreviewModal session={session!} files={files} />
      )}
      {openUpload && <Upload queryKey={queryOptions.queryKey} />}
    </div>
  );
});
