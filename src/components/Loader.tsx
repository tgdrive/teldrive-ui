import React, { useEffect } from "react"
import { useTheme } from "@mui/material"
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar"

export default function Loader() {
  const theme = useTheme()

  const color = theme.palette.onPrimaryContainer.main

  const ref = React.useRef<LoadingBarRef>(null)

  useEffect(() => {
    ref?.current?.continuousStart()
    return () => {
      ref?.current?.complete()
    }
  }, [])

  return <LoadingBar color={color} ref={ref} waitingTime={200} />
}
