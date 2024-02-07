import { useEffect, useMemo, useState } from "react"

import { isMobileDevice } from "../utils/common"

export const useDevice = () => {
  const [firstLoad, setFirstLoad] = useState(true)
  useEffect(() => {
    setFirstLoad(false)
  }, [])

  const ssr = firstLoad || typeof navigator === "undefined"

  const isMobile = useMemo(() => !ssr && isMobileDevice(), [ssr])

  return {
    isMobile,
  }
}
