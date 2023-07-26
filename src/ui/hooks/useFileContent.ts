import { useEffect, useState } from "react"

import http from "@/ui/utils/http"

export default function useFileContent(url: string) {
  const [response, setResponse] = useState("")
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    http
      .get(url)
      .then(async (res) => setResponse(await res.text()))
      .catch((e) => setError(e.message))
      .finally(() => setValidating(false))
  }, [url])
  return { response, error, validating }
}
