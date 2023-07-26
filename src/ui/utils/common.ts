import { File } from "@/ui/types"
import { FileData } from "@bhunter179/chonky"
import { ApiCredentials } from "telegram/client/auth"

export const getFiles = (data: File[]): FileData[] => {
  return data.map((item): FileData => {
    if (item.mimeType === "drive/folder")
      return {
        id: item.id,
        name: item.name,
        size: item.size ? Number(item.size) : 0,
        modDate: item.updatedAt,
        path: `my-drive${item.path}`,
        isDir: true,
        color: "#FAD165",
      }

    return {
      id: item.id,
      name: item.name,
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

export const getMediaUrl = (id: string, name: string, download = false) => {
  const host = window.location.origin

  // const isCfPages = process.env.NEXT_PUBLIC_PLATFORM === "cfpages"
  // const isDev = process.env.NODE_ENV === "development"

  return `${host}/api/files/${id}/${encodeURIComponent(name)}${
    download ? "?d=1" : ""
  }`
}

export function getServerAddress(dcId: number, downloadDC = false) {
  switch (dcId) {
    case 1:
      return {
        id: 1,
        ipAddress: `pluto${downloadDC ? "-1" : ""}.web.telegram.org`,
        port: 443,
      }
    case 2:
      return {
        id: 2,
        ipAddress: `venus${downloadDC ? "-1" : ""}.web.telegram.org`,
        port: 443,
      }
    case 3:
      return {
        id: 3,
        ipAddress: `aurora${downloadDC ? "-1" : ""}.web.telegram.org`,
        port: 443,
      }
    case 4:
      return {
        id: 4,
        ipAddress: `vesta${downloadDC ? "-1" : ""}.web.telegram.org`,
        port: 443,
      }
    case 5:
      return {
        id: 5,
        ipAddress: `flora${downloadDC ? "-1" : ""}.web.telegram.org`,
        port: 443,
      }
    default:
      throw new Error(`Cannot find the DC with the ID of ${dcId}`)
  }
}

export default function textToSvgURL(text) {
  const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" })
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    reader.readAsDataURL(blob)
  })
}

export const apiCredentials: ApiCredentials = {
  apiId: Number(process.env.NEXT_PUBLIC_API_ID),
  apiHash: process.env.NEXT_PUBLIC_API_HASH!,
}
