import ky from "ky"

const http = ky.create({
  credentials: "include",
  timeout: 30000,
})

export default http
