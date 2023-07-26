import { FC } from "react"
import { useRouter } from "next/router"

import { useSession } from "@/ui/hooks/useSession"

export default function withAuth(Component: FC<any>) {
  return function AuthComponent() {
    const router = useRouter()

    const { asPath, pathname } = router

    const { status, data } = useSession({
      onUnauthenticated() {
        router.replace(`/login?from=${encodeURIComponent(asPath)}`, undefined, {
          scroll: false,
        })
      },
    })

    if (status === "loading" || asPath === pathname) return null

    if (data) return <Component />
  }
}
