import ky from "ky"

const http = ky.create({
  timeout: 60000,
})

export default http
