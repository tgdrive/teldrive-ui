import { useEffect, useState } from "react";
import fetch from "@/utils/fetch-throw";

export default function useFileContent(url: string) {
  const [response, setResponse] = useState("");
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then(setResponse)
      .catch((e) => setError(e.message))
      .finally(() => setValidating(false));
  }, [url]);
  return { response, error, validating };
}
