import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start"

// These public Convex URLs are non-secret and already shipped to the client
// bundle. Hardcoding them as a fallback eliminates a class of Vercel/Vite
// env-passthrough bugs that surface as opaque 500s with no logs available.
const FALLBACK_CONVEX_URL = "https://earnest-mouse-779.convex.cloud"
const FALLBACK_CONVEX_SITE_URL = "https://earnest-mouse-779.convex.site"

const convexUrl = process.env.VITE_CONVEX_URL ?? FALLBACK_CONVEX_URL
const convexSiteUrl =
  process.env.VITE_CONVEX_SITE_URL ?? FALLBACK_CONVEX_SITE_URL

// We use the library only for its non-proxy exports. The built-in `handler`
// streams `request.body` with `duplex: "half"`, which breaks on Vercel because
// the runtime consumes the body before our handler runs ("expected non-null
// body source"). Buffer the body once and forward — slower for huge payloads,
// but auth requests are tiny.
const inner = convexBetterAuthReactStart({ convexUrl, convexSiteUrl })

const SITE_HOST = new URL(convexSiteUrl).host

async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url)
  const nextUrl = `${convexSiteUrl}${requestUrl.pathname}${requestUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete("transfer-encoding")
  headers.delete("content-length")
  headers.delete("connection")
  headers.set("accept-encoding", "application/json")
  headers.set("host", SITE_HOST)
  headers.set("x-forwarded-host", requestUrl.host)
  headers.set("x-forwarded-proto", requestUrl.protocol.replace(/:$/, ""))
  headers.set("x-better-auth-forwarded-host", requestUrl.host)
  headers.set(
    "x-better-auth-forwarded-proto",
    requestUrl.protocol.replace(/:$/, ""),
  )

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  return await fetch(nextUrl, {
    method: request.method,
    headers,
    redirect: "manual",
    body,
  })
}

const { getToken, fetchAuthQuery, fetchAuthMutation } = inner

export { handler, getToken, fetchAuthQuery, fetchAuthMutation }
