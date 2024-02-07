import { useEffect, useRef, useState } from "react"

export default function useHover<T extends HTMLElement>() {
  const [value, setValue] = useState<boolean>(false)
  const ref = useRef<T | null>(null)

  const handleMouseOver = () => setValue(true)
  const handleMouseOut = () => setValue(false)

  useEffect(() => {
    const node = ref.current
    if (node) {
      node.addEventListener("mouseover", handleMouseOver)
      node.addEventListener("mouseout", handleMouseOut)

      return () => {
        node.removeEventListener("mouseover", handleMouseOver)
        node.removeEventListener("mouseout", handleMouseOut)
      }
    }
  }, [ref.current])

  return [ref, value] as const
}
