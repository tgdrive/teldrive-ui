import { File, FileData, Settings } from "@/ui/types"

import { TELDRIVE_OPTIONS } from "../const"

export const getFiles = (
  data: File[],
  rootDir:
    | typeof TELDRIVE_OPTIONS.myDrive.id
    | typeof TELDRIVE_OPTIONS.shared.id
): FileData[] => {
  return data.map((item): FileData => {
    if (item.mimeType === "drive/folder")
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size ? Number(item.size) : 0,
        visibility: item.visibility,
        modDate: item.updatedAt,
        path: `${rootDir}${item.path}`,
        isDir: true,
        color: "#FAD165",
      }

    return {
      id: item.id,
      name: item.name,
      type: item.type,
      size: Number(item.size),
      starred: item.starred,
      visibility: item.visibility,
      modDate: item.updatedAt,
    }
  })
}

export const navigateToExternalUrl = (url: string, shouldOpenNewTab = true) =>
  shouldOpenNewTab ? window.open(url, "_blank") : (window.location.href = url)

export const isMobileDevice = () => {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ]
  return toMatch.some(function (toMatchItem) {
    return navigator.userAgent.match(toMatchItem)
  })
}

export const chainLinks = (paths: string[]) => {
  let obj: Record<string, string> = {}
  let pathsoFar = ""
  for (let path of paths) {
    let decodedPath = decodeURIComponent(path)
    obj[
      decodedPath === TELDRIVE_OPTIONS.myDrive.id
        ? TELDRIVE_OPTIONS.myDrive.name
        : decodedPath === TELDRIVE_OPTIONS.shared.id
        ? TELDRIVE_OPTIONS.shared.name
        : decodedPath
    ] = pathsoFar + decodedPath
    pathsoFar = pathsoFar + decodedPath + "/"
  }
  return obj
}

export const realPath = (path: string[]) =>
  path && path.length > 1
    ? path.slice(1).reduce((acc: any, val: any) => `${acc}/${val}`, "")
    : "/"

export function getRawExtension(fileName: string) {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2)
}
export function getExtension(fileName: string) {
  return getRawExtension(fileName).toLowerCase()
}

export const zeroPad = (num: number | string, places: number) =>
  String(num).padStart(places, "0")

export const getSortOrder = () =>
  JSON.parse(localStorage.getItem("sortOrder") as string) || "desc"

export const getMediaUrl = (
  id: string,
  name: string,
  apiHost?: string,
  download = false
) => {
  const host = apiHost || window.location.origin
  return `${host}/api/files/${id}/${encodeURIComponent(name)}${
    download ? "?d=1" : ""
  }`
}
export const getShareableUrl = (id: string) => {
  const host = window.location.origin
  return `${host}/shared/${id}`
}

export default function textToSvgURL(text: string) {
  const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" })
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result)
    }
    reader.readAsDataURL(blob)
  })
}

export const splitFileSizes = [
  { value: 500 * 1024 * 1024, label: "500MB" },
  { value: 1000 * 1024 * 1024, label: "1GB" },
  { value: 2 * 1000 * 1024 * 1024, label: "2GB" },
]

export const capitalize = (text: string) => {
  if (text.length === 0) {
    return text
  }

  const firstLetter = text[0].toUpperCase()
  const restOfText = text.slice(1)

  return `${firstLetter}${restOfText}`
}
