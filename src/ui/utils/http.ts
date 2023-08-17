import ky from "ky"

import { getApiUrl } from "@/ui/utils/common"

const baseUrl = getApiUrl()

const http = ky.create({
  timeout: 60000,
  ...(baseUrl && {
    prefixUrl: baseUrl,
    credentials: "include",
  }),
})

export default http
