import axios from "axios"

const http = axios.create({
  timeout: 120 * 1000,
  baseURL: "http://localhost:5000",
  withCredentials: true,
})

export default http
