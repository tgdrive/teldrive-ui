import * as React from "react"
import * as ReactDOM from "react-dom/client"

import "@/ui/styles/global.css"

import App from "./App"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
