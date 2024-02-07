import { forwardRef } from "react"
import { Link, LinkProps } from "@tanstack/react-router"

export const ForwardLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => <Link ref={ref} {...props}></Link>
)
