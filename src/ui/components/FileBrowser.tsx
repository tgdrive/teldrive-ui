import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import {
  DriveCategory,
  FileResponse,
  ModalState,
  PaginatedQueryData,
  QueryParams,
} from "@/ui/types"
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
import { QueryClient, useQueryClient } from "@tanstack/react-query"
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
  ShareFile,
  SyncFiles,
  UploadFiles,
} from "@/ui/utils/chonkyactions"
import { chainLinks, getFiles, getSortOrder } from "@/ui/utils/common"

import { TELDRIVE_OPTIONS } from "../const"
import { useSession } from "../hooks/useSession"
import DeleteDialog from "./DeleteDialog"
import ErrorView from "./ErrorView"
import FileModal from "./FileModal"
import ShareModal from "./ShareModal"
import Upload from "./UploadBar"

const PreviewModal = dynamic(() => import("./PreviewModal"), {
  ssr: false,
  loading: () => <Loader />,
})

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

  const [queryEnabled, setqueryEnabled] = useState(false)
  const { data: sessionData } = useSession()

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

  const router = useRouter()

  const { path } = router.query

  const type = path?.[0] as DriveCategory

  const queryClient = useQueryClient()

  const isSm = useMediaQuery("(max-width:600px)")

  const listRef = useRef<VirtuosoHandle | VirtuosoGridHandle>(null)

  const { preloadFiles } = usePreloadFiles()

  const fileActions = useMemo(() => {
    const actions = [
      DownloadFile,
      CopyDownloadLink,
      RenameFile(type),
      DeleteFile(type),
      ShareFile(type),
      OpenInVLCPlayer,
      SyncFiles,
      CreateFolder(isSm ? "Actions" : "", type),
      UploadFiles(isSm ? "Actions" : "", type),
    ]
    return actions
  }, [isSm, type])

  useEffect(() => {
    if (
      type === TELDRIVE_OPTIONS.myDrive.id ||
      type === TELDRIVE_OPTIONS.shared.id
    )
      setqueryEnabled(true)
    else if (type === TELDRIVE_OPTIONS.search.id && path!.length > 1) {
      setqueryEnabled(true)
    } else if (type === "starred") {
      setqueryEnabled(true)
    } else if (type === "recent") {
      setqueryEnabled(true)
    } else {
      setqueryEnabled(false)
    }
  }, [path])

  const queryParams: Partial<QueryParams> = useMemo(() => {
    return {
      key: "files",
      path,
      enabled: queryEnabled,
    }
  }, [queryEnabled, path])

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isInitialLoading,
  } = useFetchFiles(queryParams)

  const files = useMemo(() => {
    if (data)
      return data?.pages?.flatMap((page) => {
        if (type === TELDRIVE_OPTIONS.shared.id) {
          return page?.results ? getFiles(page?.results, type) : []
        } else {
          return page?.results
            ? getFiles(page?.results, TELDRIVE_OPTIONS.myDrive.id)
            : []
        }
      })
  }, [data])

  const queryKey = useMemo(() => {
    const { key, path } = queryParams
    const sortOrder = getSortOrder()
    const queryKey = [key, path, sortOrder]
    return queryKey
  }, [queryParams])

  const folderChain = useMemo(() => {
    function createFolderInfo(
      id: string,
      name: string,
      path: string,
      isDir: boolean,
      chain: boolean
    ) {
      return { id, name, path, isDir, chain }
    }

    function getFolderChainForMyDrive() {
      return Object.entries(chainLinks(path as string[])).map(
        ([key, value]) => {
          return createFolderInfo(key, key, value, true, true)
        }
      )
    }

    function getFolderChainForShared() {
      const pathChain = data?.pages[0].results
        ?.find((res) => res.parentId === path?.[1])
        ?.pathChain?.map((chain) => {
          return {
            id: chain.id,
            name: chain.path.split("/").pop() || "",
            path: `${TELDRIVE_OPTIONS.shared.id}${chain.path}`,
            isDir: true,
            chain: true,
          }
        })

      const sharedOption = sessionData?.userName
        ? [
            {
              id: TELDRIVE_OPTIONS.shared.name,
              name: TELDRIVE_OPTIONS.shared.name,
              path: TELDRIVE_OPTIONS.shared.id,
              isDir: true,
              chain: true,
            },
          ]
        : []

      return pathChain ? [...sharedOption, ...pathChain] : sharedOption
    }

    if (type === TELDRIVE_OPTIONS.myDrive.id) {
      return getFolderChainForMyDrive()
    } else if (type === TELDRIVE_OPTIONS.shared.id) {
      return getFolderChainForShared()
    }
  }, [path, data])

  const [modalState, setModalState] = useState<Partial<ModalState>>({
    open: false,
    operation: RenameFile().id,
  })

  const { open } = modalState

  const handleFileAction = useCallback(
    () =>
      handleAction(
        router,
        settings,
        setModalState,
        queryClient,
        path,
        showUpload,
        openFileDialog,
        preloadFiles,
        type
      ),
    [router, setModalState, queryClient, preloadFiles]
  )

  useEffect(() => {
    if (firstRender) {
      firstRender = false
      return
    }

    setTimeout(() => {
      listRef.current?.scrollTo({
        top: positions.get(router.asPath)?.scrollTop ?? 0,
        left: 0,
      })
    }, 0)

    return () => {
      if (listRef.current && isVirtuosoList(listRef.current))
        listRef.current?.getState((state) =>
          positions.set(router.asPath, state)
        )
    }
  }, [router.asPath])

  useEffect(() => {
    if (modalState.operation === ShareFile().id) {
      setModalState(
        (prev) =>
          ({
            ...prev,
            file: {
              ...prev.file,
              visibility: data?.pages?.[0]?.results?.find(
                (res) => res.id === modalState.file?.id
              )?.visibility,
              sharedWithUsernames: data?.pages?.[0]?.results?.find(
                (res) => res.id === modalState.file?.id
              )?.sharedWithUsernames,
            },
          }) as Partial<ModalState>
      )
    }
  }, [data, modalState.open, modalState.file?.id])

  // useEffect(() => {
  //   if (modalState.operation === "delete_file" && modalState.successful) {
  //     const path = queryParams.path as string[]
  //     for (let i = path.length; i > 0; i--) {
  //       const partialPath = path.slice(0, i)
  //       const updatedQueryKey = ["files", partialPath, queryKey[2]]
  //       queryClient.invalidateQueries(updatedQueryKey)
  //     }
  //   }
  // }, [modalState.operation, modalState.successful])

  if (error) {
    return <ErrorView error={error as Error} />
  }

  return (
    <Root className={classes.root}>
      {isInitialLoading && type !== TELDRIVE_OPTIONS.search.id && <Loader />}
      <FileBrowser
        files={files as any}
        folderChain={folderChain}
        onFileAction={handleFileAction()}
        fileActions={fileActions}
        disableDragAndDropProvider={(() => {
          if (isMobile || type === TELDRIVE_OPTIONS.shared.id) return true
          return false
        })()}
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
      {[RenameFile().id, ChonkyActions.CreateFolder.id].find(
        (val) => val === modalState.operation
      ) &&
        open && (
          <FileModal
            modalState={modalState}
            setModalState={setModalState}
            queryParams={queryParams}
            path={path}
          />
        )}
      {modalState.operation === ShareFile().id && open && (
        <ShareModal
          modalState={modalState}
          setModalState={setModalState}
          queryParams={queryParams}
        />
      )}
      {modalState.operation === ChonkyActions.OpenFiles.id && open && (
        <PreviewModal
          queryParams={queryParams}
          modalState={modalState}
          setModalState={setModalState}
        />
      )}
      {modalState.operation === DeleteFile().id && open && (
        <DeleteDialog
          queryParams={queryParams}
          modalState={modalState}
          setModalState={setModalState}
        />
      )}
      {upload && (
        <Upload
          queryParams={queryParams}
          fileDialogOpened={fileDialogOpened}
          closeFileDialog={closeFileDialog}
          hideUpload={hideUpload}
          path={path as string[]}
        />
      )}
    </Root>
  )
}

export default memo(MyFileBrowser)
