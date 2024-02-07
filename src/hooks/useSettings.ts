import { Settings } from "@/types"
import { useLocalStorage } from "usehooks-ts"

import { splitFileSizes } from "@/utils/common"

const defaultSettings: Settings = {
  pageSize: 500,
  splitFileSize: splitFileSizes[1].value,
  uploadConcurrency: 4,
  encryptFiles: "no",
  resizerHost: "",
}

export default function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "settings",
    defaultSettings
  )
  return { settings, setSettings }
}
