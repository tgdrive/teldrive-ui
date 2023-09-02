import { FC } from "react"
import { useRouter } from "next/router"

import { useSession } from "@/ui/hooks/useSession"

export default function withAuth(Component: FC<any>) {
  return function AuthComponent() {
    const router = useRouter()

    const { status, data, fileVisibility } = useSession({
      onUnauthenticated() {
        router.replace(
          `/login?from=${encodeURIComponent(window.location.pathname)}`,
          undefined,
          {
            scroll: false,
          }
        )
      },
    })

    if (status === "loading") return null

    if (data || fileVisibility === "public") return <Component />
  }
}
