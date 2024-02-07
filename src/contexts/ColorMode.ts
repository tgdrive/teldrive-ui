import React from "react"

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default React.createContext({
  toggleColorMode: () => {},
  resetTheme: () => {},
  setSchemeColor: (color: string) => {},
  schemeColor: "",
})
