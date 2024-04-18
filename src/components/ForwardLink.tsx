import { forwardRef } from "react"
import { LinkProps, useLinkProps } from "@tanstack/react-router"

const InternalLink = forwardRef((props: any, ref) => {
  return (
    <a
      {...{
        ref,
        ...props,
      }}
    />
  )
}) as any

const Link = forwardRef<HTMLAnchorElement, any>((props, ref) => {
  const { type, ...linkProps } = useLinkProps(props)

  const children =
    typeof props.children === "function"
      ? props.children({
          isActive: (linkProps as any)["data-status"] === "active",
        })
      : props.children

  if (type === "external") {
    return <a {...linkProps} ref={ref} children={children} />
  }

  return <InternalLink {...linkProps} ref={ref} children={children} />
})

export const ForwardLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => <Link ref={ref} {...props}></Link>
)
