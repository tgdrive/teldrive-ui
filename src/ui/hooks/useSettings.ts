import { Settings } from "@/ui/types"
import { useLocalStorage } from "usehooks-ts"

import { splitFileSizes } from "@/ui/utils/common"

const defaultSettings: Settings = {
  apiUrl: "",
  accessToken: "",
  splitFileSize: splitFileSizes[1].value,
  uploadConcurrency: 4,
}

export default function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "settings",
    defaultSettings
  )
  return { settings, setSettings }
}
