import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
import useMediaQuery from "@mui/material/useMediaQuery"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  StateSnapshot,
  VirtuosoGridHandle,
  VirtuosoHandle,
} from "react-virtuoso"
import { useBoolean } from "usehooks-ts"

import { useFetchFiles, usePreloadFiles } from "@/ui/hooks/queryhooks"
import { useDevice } from "@/ui/hooks/useDevice"
import useSettings from "@/ui/hooks/useSettings"
import Loader from "@/ui/components/Loader"
import {
  CopyDownloadLink,
  CreateFolder,
  DeleteFile,
  DownloadFile,
  handleAction,
  OpenInVLCPlayer,
  RenameFile,
  SyncFiles,
  UploadFiles,
} from "@/ui/utils/chonkyactions"
import { chainLinks, getFiles, getParams } from "@/ui/utils/common"

import DeleteDialog from "./DeleteDialog"
import ErrorView from "./ErrorView"
import FileModal from "./FileModal"
import Upload from "./UploadBar"

const PreviewModal = lazy(() => import("./PreviewModal"))

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

const MyFileBrowser = () => {
  const { settings } = useSettings()

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

  const queryClient = useQueryClient()

  const isSm = useMediaQuery("(max-width:600px)")

  const listRef = useRef<VirtuosoHandle | VirtuosoGridHandle>(null)

  const navigate = useNavigate()
  const { preloadFiles } = usePreloadFiles()

  const fileActions = useMemo(
    () => [
      DownloadFile,
      RenameFile,
      DeleteFile,
      CopyDownloadLink,
      OpenInVLCPlayer,
      SyncFiles,
      CreateFolder(isSm ? "Actions" : "", type),
      UploadFiles(isSm ? "Actions" : "", type),
    ],
    [isSm, type]
  )

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useFetchFiles(params)

  const files = useMemo(() => {
    if (data)
      return data?.pages?.flatMap((page) =>
        page?.results ? getFiles(page?.results) : []
      )
  }, [data])

  const folderChain = useMemo(() => {
    if (type == "my-drive") {
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
    operation: RenameFile.id,
  })

  const { open } = modalState

  const handleFileAction = useCallback(
    () =>
      handleAction(
        params,
        settings,
        setModalState,
        queryClient,
        path,
        showUpload,
        openFileDialog,
        preloadFiles
      ),
    [navigate, setModalState, queryClient, preloadFiles]
  )

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
      {isInitialLoading && type !== "search" && <Loader />}
      <FileBrowser
        files={files as any}
        folderChain={folderChain}
        onFileAction={handleFileAction()}
        fileActions={fileActions}
        disableDragAndDropProvider={isMobile ? true : false}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        useStoreProvider={true}
        useThemeProvider={false}
        defaultSortActionId={null}
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
      {[RenameFile.id, ChonkyActions.CreateFolder.id].find(
        (val) => val === modalState.operation
      ) &&
        open && (
          <FileModal modalState={modalState} setModalState={setModalState} />
        )}
      {modalState.operation === ChonkyActions.OpenFiles.id && open && (
        <Suspense fallback={<Loader />}>
          <PreviewModal modalState={modalState} setModalState={setModalState} />
        </Suspense>
      )}
      {modalState.operation === DeleteFile.id && open && (
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
