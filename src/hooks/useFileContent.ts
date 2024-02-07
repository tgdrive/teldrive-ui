import { useEffect, useState } from "react"
import http from "@/utils/http"

export default function useFileContent(url: string) {
  const [response, setResponse] = useState("")
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    http
      .get(url)
      .then((res) => {
        setResponse(res.data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setValidating(false))
  }, [url])
  return { response, error, validating }
}
