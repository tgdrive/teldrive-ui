import React, {
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Poppins } from "next/font/google"
import ColorModeContext from "@/ui/contexts/colorModeContext"
import { useChonkyTheme } from "@bhunter179/chonky"
import {
  colors,
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  PaletteMode,
  Theme,
} from "@mui/material"
import { IntlProvider } from "react-intl"
import { useLocalStorage } from "usehooks-ts"

import { ProgressProvider } from "./TopProgress"

const materialColors = Object.keys(colors)
  .filter((x) => x !== "common")
  .map((color) => (colors as Record<string, any>)[color].A100)

const poppins = Poppins({
  adjustFontFallback: true,
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  preload: true,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    '"Noto Sans"',
    "sans-serif",
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ],
})

const muiThemeOverride = {
  typography: {
    fontFamily: poppins.style.fontFamily,
    body1: {
      fontFamily: poppins.style.fontFamily,
    },
  },
}

const DriveThemeProvider: FC<{
  children: ReactNode
}> = ({ children }) => {
  const [mode, setMode] = useLocalStorage("themeMode", "light")

  const [schemeColor, setSchemeColor] = useLocalStorage(
    "schemeColor",
    colors.indigo.A100
  )

  const [colorIndex, setColorIndex] = useState<number>(
    materialColors.findIndex((x) => x === schemeColor)
  )

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"))
      },
      randomColorScheme: () =>
        setColorIndex((prev) => (prev >= materialColors.length ? 0 : prev + 1)),
      resetTheme: () => {
        setMode("light")
        setColorIndex(materialColors.findIndex((x) => x === colors.indigo.A100))
      },
    }),
    []
  )

  const firstUpdate = useRef(true)

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false
      return
    }
    setMode(mode)
    setSchemeColor(materialColors[colorIndex])
  }, [mode, materialColors[colorIndex]])

  const theme = useChonkyTheme(
    mode as PaletteMode,
    materialColors[colorIndex],
    muiThemeOverride as Theme
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <IntlProvider locale="en">
          <ProgressProvider>{children}</ProgressProvider>
        </IntlProvider>
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default DriveThemeProvider
