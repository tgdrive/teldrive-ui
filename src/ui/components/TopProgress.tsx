import * as React from "react"
import { useTheme } from "@mui/material"
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar"

interface InitContextProps {
  ref: React.RefObject<LoadingBarRef>
  startProgress: () => void
  stopProgress: () => void
}

const ProgressContext = React.createContext({} as InitContextProps)

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<LoadingBarRef>(null)

  const theme = useTheme()

  const color = theme.palette.onPrimaryContainer.main

  const startProgress = () => ref?.current?.continuousStart()

  const stopProgress = () => ref?.current?.complete()

  const value = React.useMemo(
    () => ({ ref, startProgress, stopProgress }),
    [ref, startProgress, stopProgress]
  )
  return (
    <ProgressContext.Provider value={value}>
      {children}
      <LoadingBar color={color} ref={ref} waitingTime={200} />
    </ProgressContext.Provider>
  )
}

export const useProgress = () => React.useContext(ProgressContext)
