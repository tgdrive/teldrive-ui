import { Settings } from "@/ui/types"
import axios from "axios"

const http = axios.create({
  timeout: 60000,
  withCredentials: true,
})

http.interceptors.request.use(function (config) {
  const settings = JSON.parse(localStorage.getItem("settings")) as Settings
  if (settings && settings.apiUrl) {
    config.baseURL = settings.apiUrl
  }
  return config
})

export default http
