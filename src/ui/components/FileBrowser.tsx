import { memo, useEffect, useMemo, useRef, useState } from "react"
import { ModalState } from "@/ui/types"
import {
  ChonkyActions,
  FileBrowser,
  FileContextMenu,
  FileList,
  FileNavbar,
  FileToolbar,
} from "@bhunter179/chonky"
import { styled } from "@mui/material/styles"
import { useParams } from "react-router-dom"
import {
  StateSnapshot,
  VirtuosoGridHandle,
  VirtuosoHandle,
} from "react-virtuoso"
import { useBoolean } from "usehooks-ts"

import { useFetchFiles } from "@/ui/hooks/queryhooks"
import { useDevice } from "@/ui/hooks/useDevice"
import { CustomActions, useFileAction } from "@/ui/hooks/useFileAction"
import { useSortFilter } from "@/ui/hooks/useSortFilter"
import Loader from "@/ui/components/Loader"
import { chainLinks, getFiles, getParams } from "@/ui/utils/common"

import DeleteDialog from "./DeleteDialog"
import ErrorView from "./ErrorView"
import FileModal from "./FileModal"
import PreviewModal from "./PreviewModal"
import Upload from "./UploadBar"

const PREFIX = "MyFileBrowser"

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
}
const MyFileBrowser = () => {
  const positions = useRef<Map<string, StateSnapshot>>(new Map()).current

  const params = getParams(useParams())

  const { type, path } = params

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

  const { sortFilter } = useSortFilter()

  const order = useMemo(() => {
    const defaultSortOrder = sortFilter[type].order
    const defaultSortActionId = sortMap[sortFilter[type].sort]

    return { defaultSortOrder, defaultSortActionId }
  }, [sortFilter, type])

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFetchFiles(params)

  const files = useMemo(() => {
    if (data)
      return data?.pages?.flatMap((page) =>
        page?.results ? getFiles(page?.results) : []
      )
  }, [data])

  const folderChain = useMemo(() => {
    if (type === "my-drive") {
      return Object.entries(chainLinks(path)).map(([key, value]) => ({
        id: key,
        name: key,
        path: value,
        isDir: true,
        chain: true,
      }))
    }
  }, [type, path])

  const [modalState, setModalState] = useState<Partial<ModalState>>({
    open: false,
    operation: CustomActions.RenameFile.id,
  })

  const { fileActions, chonkyActionHandler } = useFileAction(
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
        top: positions.get(type + path!)?.scrollTop ?? 0,
        left: 0,
      })
    }, 0)

    return () => {
      if (listRef.current && isVirtuosoList(listRef.current))
        listRef.current?.getState((state) => positions.set(type + path!, state))
    }
  }, [type, path])

  if (error) {
    return <ErrorView error={error as Error} />
  }

  return (
    <Root className={classes.root}>
      {isLoading && type !== "search" && <Loader />}
      <FileBrowser
        files={files as any}
        folderChain={folderChain}
        onFileAction={chonkyActionHandler()}
        fileActions={fileActions}
        disableDragAndDropProvider={isMobile ? true : false}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        useStoreProvider={true}
        useThemeProvider={false}
        defaultSortActionId={order.defaultSortActionId}
        defaultSortOrder={order.defaultSortOrder}
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
      {[CustomActions.RenameFile.id, ChonkyActions.CreateFolder.id].find(
        (val) => val === modalState.operation
      ) &&
        open && (
          <FileModal modalState={modalState} setModalState={setModalState} />
        )}
      {modalState.operation === ChonkyActions.OpenFiles.id && open && (
        <PreviewModal modalState={modalState} setModalState={setModalState} />
      )}
      {modalState.operation === CustomActions.DeleteFile.id && open && (
        <DeleteDialog modalState={modalState} setModalState={setModalState} />
      )}
      {upload && (
        <Upload
          fileDialogOpened={fileDialogOpened}
          closeFileDialog={closeFileDialog}
          hideUpload={hideUpload}
        />
      )}
    </Root>
  )
}

export default memo(MyFileBrowser)
