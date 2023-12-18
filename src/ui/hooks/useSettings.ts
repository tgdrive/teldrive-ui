import { Settings } from "@/ui/types"
import { useLocalStorage } from "usehooks-ts"

import { splitFileSizes } from "@/ui/utils/common"

const defaultSettings: Settings = {
  apiUrl: "",
  splitFileSize: splitFileSizes[1].value,
  uploadConcurrency: 4,
  encryptFiles: "no",
}

export default function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "settings",
    defaultSettings
  )
  return { settings, setSettings }
}
