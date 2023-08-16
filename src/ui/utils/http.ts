import ky from "ky"

const http = ky.create({
  timeout: 60000,
  ...(process.env.NEXT_PUBLIC_API_HOST && {
    prefixUrl: process.env.NEXT_PUBLIC_API_HOST,
    credentials: "include",
  }),
})

export default http
