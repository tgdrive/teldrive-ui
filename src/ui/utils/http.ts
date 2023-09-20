import { Settings } from "@/ui/types"
import axios from "axios"

const http = axios.create({
  timeout: 120 * 1000,
  withCredentials: true,
})

http.interceptors.request.use(function (config) {
  const settings = JSON.parse(
    localStorage.getItem("settings") as string
  ) as Settings
  if (settings && settings.apiUrl) {
    config.baseURL = settings.apiUrl
  }
  return config
})

export default http
