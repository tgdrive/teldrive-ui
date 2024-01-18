import React, { FC, ReactNode, useMemo } from "react"
import ColorModeContext from "@/ui/contexts/colorModeContext"
import { useChonkyTheme } from "@bhunter179/chonky"
import {
  colors,
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  PaletteMode,
  ThemeOptions,
} from "@mui/material"
import { Toaster } from "react-hot-toast"
import { IntlProvider } from "react-intl"
import { useLocalStorage } from "usehooks-ts"

import { ProgressProvider } from "./TopProgress"

const muiThemeOverrides: Partial<ThemeOptions> = {
  typography: {
    fontFamily: "'Poppins', sans-seriff",
    body1: {
      fontFamily: "'Poppins', sans-seriff",
    },
    button: {
      fontFamily: "'Poppins', sans-seriff",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
}

const DriveThemeProvider: FC<{
  children: ReactNode
}> = ({ children }) => {
  const [mode, setMode] = useLocalStorage("themeMode", "light")

  const [schemeColor, setSchemeColor] = useLocalStorage<string>(
    "schemeColor",
    colors.indigo.A100
  )

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"))
      },
      resetTheme: () => {
        setMode("light")
        setSchemeColor(colors.indigo.A100)
      },
      setSchemeColor: setSchemeColor,
      schemeColor: schemeColor,
    }),
    []
  )

  const theme = useChonkyTheme(
    mode as PaletteMode,
    schemeColor,
    muiThemeOverrides as any
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <IntlProvider locale="en">
          <Toaster position="bottom-right" />
          <ProgressProvider>{children}</ProgressProvider>
        </IntlProvider>
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default DriveThemeProvider
