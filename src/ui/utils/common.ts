import { File, Settings } from "@/ui/types"
import { FileData } from "@bhunter179/chonky"

export const getFiles = (data: File[]): FileData[] => {
  return data.map((item): FileData => {
    if (item.mimeType === "drive/folder")
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size ? Number(item.size) : 0,
        modDate: item.updatedAt,
        path: `my-drive${item.path}`,
        isDir: true,
        color: "#FAD165",
      }

    return {
      id: item.id,
      name: item.name,
      type: item.type,
      size: Number(item.size),
      starred: item.starred,
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
    obj[decodedPath === "my-drive" ? "My drive" : decodedPath] =
      pathsoFar + decodedPath
    pathsoFar = pathsoFar + decodedPath + "/"
  }
  return obj
}

export const realPath = (path: string[]) =>
  path && path.length > 1
    ? path.slice(1).reduce((acc: any, val: any) => `${acc}/${val}`, "")
    : "/"

export function getRawExtension(fileName: string | string[]) {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2)
}
export function getExtension(fileName: string) {
  return getRawExtension(fileName).toLowerCase()
}

export const zeroPad = (num: number | string, places: number) =>
  String(num).padStart(places, "0")

export const getSortOrder = () =>
  JSON.parse(localStorage.getItem("sortOrder") as string) || "desc"

export const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const settings: Settings | null = JSON.parse(
      localStorage.getItem("settings") as string
    )
    if (settings && settings.apiUrl) return settings.apiUrl
    else
      return process.env.NEXT_PUBLIC_API_HOST
        ? process.env.NEXT_PUBLIC_API_HOST
        : ""
  }
}

export const getMediaUrl = (id: string, name: string, download = false) => {
  let host = getApiUrl()
  host = host ? host : window.location.origin

  return `${host}/api/files/${id}/${encodeURIComponent(name)}${
    download ? "?d=1" : ""
  }`
}

export const getWebSocketUrl = () => {
  let host = getApiUrl()
  host = host ? host : window.location.origin
  const url = new URL(host)
  return `${url.protocol === "http:" ? "ws" : "wss"}://${url.host}`
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
  { value: 1024 * 1024 * 1024, label: "1GB" },
  { value: 2 * 1024 * 1024 * 1024, label: "2GB" },
]
