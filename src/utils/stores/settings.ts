import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Settings = {
  pageSize: number;
  resizerHost: string;
  rcloneProxy: string;
};

interface SettingsStore extends Settings {
  setSettings: (settings: Partial<Settings>) => void;
  reset: () => void;
}

const defaultSettings: Settings = {
  pageSize: 500,
  resizerHost: "",
  rcloneProxy: "",
} as const;

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setSettings: (newSettings) =>
        set((state) => ({
          ...state,
          ...newSettings,
        })),

      reset: () => set(defaultSettings),
    }),
    {
      name: "drive-settings",
    },
  ),
);

export const getSettings = () => useSettings.getState();
