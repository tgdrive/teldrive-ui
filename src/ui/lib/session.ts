import http from "@/ui/utils/http"

export function withSession(handler) {
  return async function nextWithSession(context) {
    try {
      const session = (
        await http.get("http://localhost:3000/api/auth/session", {
          headers: { cookie: context.req.headers["cookie"] },
        })
      ).json()
      context.req.session = session
    } catch {}

    return handler(context)
  }
}
