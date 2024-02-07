import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ModalState } from "@/types"
import {
  ChonkyActions,
  FileBrowser,
  FileContextMenu,
  FileData,
  FileList,
  FileNavbar,
  FileToolbar,
} from "@bhunter179/chonky"
import { styled } from "@mui/material/styles"
import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query"
import { getRouteApi } from "@tanstack/react-router"
import type {
  StateSnapshot,
  VirtuosoGridHandle,
  VirtuosoHandle,
} from "react-virtuoso"
import { useBoolean } from "usehooks-ts"

import { useDevice } from "@/hooks/useDevice"
import { useFileAction } from "@/hooks/useFileAction"
import { useSession } from "@/hooks/useSession"
import useSettings from "@/hooks/useSettings"
import { defaultSortState } from "@/hooks/useSortFilter"
import Loader from "@/components/Loader"
import { chainLinks, getMediaUrl } from "@/utils/common"
import { filesQueryOptions } from "@/utils/queryOptions"

import DeleteDialog from "./dialogs/Delete"
import ErrorView from "./ErrorView"
import FileModal from "./modals/FileOperation"
import PreviewModal from "./modals/Preview"
import Upload from "./Uploader"

const PREFIX = "FileBrowser"

const classes = {
  root: `${PREFIX}-root`,
  progress: `${PREFIX}-progress`,
}

const Root = styled(
  "div",
  {}
)(({ theme }) => ({
  [`&.${classes.root}`]: {
    height: "100%",
    width: "100%",
    margin: "auto",
  },

  [`& .${classes.progress}`]: {
    margin: "auto",
    color: theme.palette.text.primary,
    height: "30px !important",
    width: "30px !important",
  },
}))

let firstRender = true

function isVirtuosoList(value: any): value is VirtuosoHandle {
  return (value as VirtuosoHandle).getState !== undefined
}

const sortMap = {
  name: ChonkyActions.SortFilesByName.id,
  updatedAt: ChonkyActions.SortFilesByDate.id,
  size: ChonkyActions.SortFilesBySize.id,
} as const

const viewMap = {
  list: ChonkyActions.EnableListView.id,
  grid: ChonkyActions.EnableGridView.id,
} as const

const fileRoute = getRouteApi("/_authenticated/$")

export const DriveFileBrowser = () => {
  const positions = useRef<Map<string, StateSnapshot>>(new Map()).current

  const { queryParams: params } = fileRoute.useRouteContext()

  const {
    value: upload,
    setTrue: showUpload,
    setFalse: hideUpload,
  } = useBoolean(false)

  const {
    value: fileDialogOpened,
    setTrue: openFileDialog,
    setFalse: closeFileDialog,
  } = useBoolean(false)

  const { isMobile } = useDevice()

  const listRef = useRef<VirtuosoHandle | VirtuosoGridHandle>(null)

  const queryOptions = filesQueryOptions(params)

  const {
    data: files,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSuspenseInfiniteQuery(queryOptions)

  const folderChain = useMemo(() => {
    if (params.type === "my-drive") {
      return Object.entries(chainLinks(params.path)).map(([key, value]) => ({
        id: key,
        name: key,
        path: value,
        isDir: true,
        chain: true,
      }))
    }
  }, [params.path, params.type])

  const [modalState, setModalState] = useState<ModalState>({
    open: false,
  })

  const { fileActions, chonkyActionHandler } = useFileAction(
    params,
    setModalState,
    showUpload,
    openFileDialog
  )

  const { open } = modalState

  useEffect(() => {
    if (firstRender) {
      firstRender = false
      return
    }

    setTimeout(() => {
      listRef.current?.scrollTo({
        top: positions.get(params.type + params.path)?.scrollTop ?? 0,
        left: 0,
      })
    }, 0)

    return () => {
      if (listRef.current && isVirtuosoList(listRef.current))
        listRef.current?.getState((state) =>
          positions.set(params.type + params.path, state)
        )
    }
  }, [params.path, params.type])

  if (error) {
    return <ErrorView error={error as Error} />
  }

  const defaultView = localStorage.getItem("view") || "list"

  const { settings } = useSettings()

  const { data: session } = useSession()

  const thumbnailGenerator = useCallback(
    (file: FileData) => {
      if (file.previewType === "image") {
        const mediaUrl = getMediaUrl(file.id, file.name, session?.hash!)
        const url = new URL(mediaUrl)
        url.searchParams.set("w", "360")
        return settings.resizerHost
          ? `${settings.resizerHost}/${url.host}${url.pathname}${url.search}`
          : mediaUrl
      }
    },
    [settings.resizerHost]
  )

  const actions = useMemo(
    () =>
      Object.keys(fileActions).map(
        (x) => fileActions[x as keyof typeof fileActions]
      ),
    [params.path, params.type]
  )

  return (
    <Root className={classes.root}>
      {isLoading && params.type !== "search" && <Loader />}
      <FileBrowser
        files={files as any}
        folderChain={folderChain}
        onFileAction={chonkyActionHandler()}
        fileActions={actions}
        disableDragAndDropProvider={isMobile ? true : false}
        defaultFileViewActionId={viewMap[defaultView as "list" | "grid"]}
        useStoreProvider={true}
        useThemeProvider={false}
        defaultSortActionId={sortMap[defaultSortState[params.type].sort]}
        defaultSortOrder={defaultSortState[params.type].order}
        defaultFileViewEntryHeight={params.type !== "my-drive" ? 60 : undefined}
        thumbnailGenerator={thumbnailGenerator}
      >
        <FileNavbar />

        <FileToolbar hideSearchBar={true} />
        <FileList
          hasNextPage={hasNextPage}
          isNextPageLoading={isFetchingNextPage}
          loadNextPage={fetchNextPage}
          ref={listRef}
        />
        <FileContextMenu />
      </FileBrowser>
      {["rename_file", ChonkyActions.CreateFolder.id].find(
        (val) => val === modalState.operation
      ) &&
        open && (
          <FileModal
            queryKey={queryOptions.queryKey}
            modalState={modalState}
            setModalState={setModalState}
          />
        )}
      {modalState.operation === ChonkyActions.OpenFiles.id && open && (
        <PreviewModal
          files={files!}
          queryKey={queryOptions.queryKey}
          modalState={modalState}
          setModalState={setModalState}
        />
      )}
      {modalState.operation === "delete_file" && open && (
        <DeleteDialog
          queryKey={queryOptions.queryKey}
          modalState={modalState}
          setModalState={setModalState}
        />
      )}
      {upload && (
        <Upload
          queryKey={queryOptions.queryKey}
          fileDialogOpened={fileDialogOpened}
          closeFileDialog={closeFileDialog}
          hideUpload={hideUpload}
        />
      )}
    </Root>
  )
}
