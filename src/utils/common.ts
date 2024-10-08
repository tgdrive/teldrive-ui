import type { Session } from "@/types";
import { partial } from "filesize";
import { settings } from "./defaults";

export const navigateToExternalUrl = (url: string, shouldOpenNewTab = true) => {
  if (shouldOpenNewTab) {
    window.open(url, "_blank");
  } else {
    window.location.href = url;
  }
};

export const chainLinks = (path: string) => {
  const paths = path?.split("/").slice(1);
  let pathsoFar = "/";
  const chains = [["My Drive", pathsoFar]] as Array<[string, string]>;
  for (const path of paths) {
    const decodedPath = decodeURIComponent(path);
    chains.push([decodedPath, pathsoFar + decodedPath]);
    pathsoFar = `${pathsoFar + decodedPath}/`;
  }

  return chains;
};

export const chainSharedLinks = (root: string, path: string) => {
  const paths = path?.split("/").slice(1);
  const chains = [[root, ""]] as Array<[string, string]>;

  if (!path) {
    return chains;
  }

  let pathsoFar = "/";
  for (const path of paths) {
    const decodedPath = decodeURIComponent(path);
    chains.push([decodedPath, pathsoFar + decodedPath]);
    pathsoFar = `${pathsoFar + decodedPath}/`;
  }
  return chains;
};

export const realPath = (parts: string[]) =>
  parts.length > 1 ? parts.slice(1).reduce((acc: any, val: any) => `${acc}/${val}`, "") : "/";

export function getRawExtension(fileName: string | string[]) {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
}
export function getExtension(fileName: string) {
  return (getRawExtension(fileName) as string).toLowerCase();
}

export const zeroPad = (num: number | string, places: number) => String(num).padStart(places, "0");

export const copyDataToClipboard = (data: string[]) => {
  return new Promise((resolve, reject) => {
    const textToCopy = data.join("\n");

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        resolve("copy success");
      })
      .catch((err) => {
        const errorMessage = `Unable to copy array to clipboard: ${err}`;
        console.error(errorMessage);
        reject(errorMessage);
      });
  });
};

export function formatDuration(value: number) {
  const minute = Math.floor(value / 60);
  const secondLeft = Math.floor(value - minute * 60);
  return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
}

export function formatTime(epochTime: number): string {
  const milliseconds = epochTime * 1000;

  const date = new Date(milliseconds);

  const formattedDate = date.toISOString();

  return formattedDate;
}

export function encode(str: string) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\x00",
  } as const;
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match as keyof typeof charMap];
  });
}

export const mediaUrl = (
  id: string,
  name: string,
  path: string,
  sessionHash: string,
  download = false,
) => {
  if (settings.rcloneProxy && path) {
    return `${settings.rcloneProxy}${path === "/" ? "" : path}/${encodeURIComponent(name)}`;
  }
  return `${window.location.origin}/api/files/${id}/${download ? "download" : "stream"}/${encodeURIComponent(
    name,
  )}?hash=${sessionHash}`;
};

export const sharedMediaUrl = (shareId: string, fileId: string, name: string, download = false) => {
  const host = window.location.origin;
  return `${host}/api/share/${shareId}/files/${fileId}/${download ? "download" : "stream"}/${encodeURIComponent(name)}`;
};

export const profileUrl = (session: Session) => `/api/users/profile?photo=1&hash=${session.hash}`;

export const profileName = (session: Session) => session.userName;

export function bytesToGB(bytes: number) {
  const gb = bytes / 1024 ** 3;
  return Math.round(gb * 10) / 10;
}

export const filesize = partial({ standard: "jedec" });

export const splitFileSizes = [
  { value: 100 * 1024 * 1024, label: "100MB" },
  { value: 500 * 1024 * 1024, label: "500MB" },
  { value: 1000 * 1024 * 1024, label: "1GB" },
  { value: 2 * 1000 * 1024 * 1024, label: "2GB" },
];

const isMobileDevice = () => {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];
  return toMatch.some((toMatchItem) => navigator.userAgent.match(toMatchItem));
};

export const isMobile = isMobileDevice();

export const chunkArray = <T>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, index) =>
    arr.slice(index * size, index * size + size),
  );
};

export const preloadImage = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject();
    image.src = src;
  });
};

export function getNextDate(): string {
  const today: Date = new Date();
  today.setDate(today.getDate() + 1);

  const year: number = today.getFullYear();
  const month: string = String(today.getMonth() + 1).padStart(2, "0");
  const day: string = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCountryCode(): string | null {
  const language: string = navigator.language || (navigator as any).userLanguage;

  if (language.includes("-")) {
    const parts: string[] = language.split("-");
    return parts[1].toUpperCase();
  }

  return "US";
}
