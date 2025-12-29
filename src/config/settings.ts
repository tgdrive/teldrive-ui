export type FieldType =
  | "text"
  | "number"
  | "email"
  | "url"
  | "select"
  | "switch"
  | "textarea";

type SettingKeys =
  | "uploadConcurrency"
  | "uploadRetries"
  | "uploadRetryDelay"
  | "randomChunking"
  | "resizerHost"
  | "pageSize"
  | "splitFileSize"
  | "encryptFiles"
  | "rcloneProxy";

type SettingValue = string | number | boolean;

export interface SettingFieldConfig<T> {
  key: SettingKeys;
  type: FieldType;
  label: string;
  description: string;
  placeholder?: string;
  defaultValue?: T;
  options?: Array<{ value: T; label: string }>;
  validation?: {
    pattern?: RegExp;
    custom?: (value: SettingValue) => string | true;
  };
  category: "upload" | "display" | "security" | "other";
}

const splitFileSizes = [
  { value: 100 * 1024 * 1024, label: "100MB" },
  { value: 500 * 1024 * 1024, label: "500MB" },
  { value: 1000 * 1024 * 1024, label: "1GB" },
  { value: 2 * 1000 * 1024 * 1024, label: "2GB" },
];

export const generalSettingsConfig: SettingFieldConfig<SettingValue>[] = [
  {
    key: "uploadConcurrency",
    type: "number",
    label: "Concurrency",
    description: "Concurrent Part Uploads",
    defaultValue: 4,
    category: "upload",
  },
  {
    key: "uploadRetries",
    type: "number",
    label: "Upload Retries",
    description: "Number of retries for each part upload",
    defaultValue: 3,
    category: "upload",
  },
  {
    key: "uploadRetryDelay",
    type: "number",
    label: "Upload Retry Delay",
    description: "Delay between retries in milliseconds",
    defaultValue: 1000,
    category: "upload",
  },
  {
    key: "resizerHost",
    type: "url",
    label: "Resizer Host",
    description: "Image Resize Host to resize images",
    placeholder: "https://resizer.example.com",
    category: "other",
  },
  {
    key: "pageSize",
    type: "number",
    label: "Page Size",
    description: "Number of items per page",
    defaultValue: 500,
    category: "display",
  },
  {
    key: "splitFileSize",
    type: "select",
    label: "Split File Size",
    description: "Split File Size for multipart uploads",
    options: splitFileSizes,
    defaultValue: splitFileSizes[1].value,
    category: "upload",
  },
  {
    key: "encryptFiles",
    type: "switch",
    label: "Encrypt Files",
    description: "Encrypt Files before uploading",
    defaultValue: false,
    category: "upload",
  },
  {
    key: "randomChunking",
    type: "switch",
    label: "Random Chunking",
    description: "Randomize Names of File Chunks",
    defaultValue: true,
    category: "upload",
  },
  {
    key: "rcloneProxy",
    type: "url",
    label: "Rclone Media Proxy",
    description: "Play Files directly from Rclone Webdav",
    placeholder: "http://localhost:8080",
    category: "other",
  },
];

type LiteralToPrimitive<T> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T;

export type Settings = {
  [P in (typeof generalSettingsConfig)[number] as P["key"]]: LiteralToPrimitive<
    P["defaultValue"]
  >;
};

export function getSettingsValues(): Settings {
  const settings = {} as any;
  for (const item of generalSettingsConfig) {
    if (item.defaultValue !== undefined) {
      settings[item.key] = item.defaultValue;
    } else {
      switch (item.type) {
        case "number":
          settings[item.key] = 0;
          break;
        case "switch":
          settings[item.key] = false;
          break;
        default:
          settings[item.key] = "";
      }
    }
  }
  return settings;
}

export const categoryConfig = {
  upload: {
    title: "Uploads",
    description: "Configure upload behavior",
  },
  display: {
    title: "Display",
    description: "Customize how content is displayed",
  },
  security: {
    title: "Security",
    description: "Configure security options",
  },
  other: {
    title: "Other",
    description: "Other Options",
  },
} as const;
