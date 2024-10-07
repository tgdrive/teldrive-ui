import { useLocalStorage } from "usehooks-ts";

import { splitFileSizes } from "@/utils/common";

const defaultSettings = {
  pageSize: "500",
  splitFileSize: splitFileSizes[1].value.toString(),
  uploadConcurrency: "4",
  encryptFiles: false,
  resizerHost: "",
  rcloneProxy: "",
} as const;

export default function useSettings() {
  const [settings, setSettings] = useLocalStorage("settings", defaultSettings);
  return { settings, setSettings };
}

export type Settings = typeof defaultSettings;
