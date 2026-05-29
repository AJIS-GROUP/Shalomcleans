import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start"

// These public Convex URLs are non-secret and already shipped to the client
// bundle. Hardcoding them as a fallback eliminates a class of Vercel/Vite
// env-passthrough bugs that surface as opaque 500s with no logs available.
const FALLBACK_CONVEX_URL = "https://earnest-mouse-779.convex.cloud"
const FALLBACK_CONVEX_SITE_URL = "https://earnest-mouse-779.convex.site"

const convexUrl = process.env.VITE_CONVEX_URL ?? FALLBACK_CONVEX_URL
const convexSiteUrl =
  process.env.VITE_CONVEX_SITE_URL ?? FALLBACK_CONVEX_SITE_URL

const inner = convexBetterAuthReactStart({
  convexUrl,
  convexSiteUrl,
})

// Temporary diagnostic wrapper: surface the real error when the proxy throws,
// instead of h3's opaque {"message":"HTTPError","unhandled":true}. Remove once
// login is verified working.
function describe(e: unknown, depth = 0): Record<string, unknown> | string {
  if (!(e instanceof Error)) return String(e)
  if (depth > 3) return `${e.name}: ${e.message}`
  const out: Record<string, unknown> = {
    name: e.name,
    message: e.message,
    stack: e.stack?.split("\n").slice(0, 6).join("\n"),
  }
  for (const k of ["code", "errno", "syscall", "address", "port"]) {
    const v = (e as unknown as Record<string, unknown>)[k]
    if (v !== undefined) out[k] = v
  }
  if ((e as { cause?: unknown }).cause !== undefined) {
    out.cause = describe((e as { cause?: unknown }).cause, depth + 1)
  }
  return out
}

async function handler(request: Request): Promise<Response> {
  try {
    return await inner.handler(request)
  } catch (err) {
    const detail = describe(err)
    // eslint-disable-next-line no-console
    console.error("[auth-proxy] handler threw:", JSON.stringify(detail))
    return new Response(
      JSON.stringify({
        status: 500,
        message: "auth proxy threw",
        detail,
        convexSiteUrl,
        convexUrl,
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }
}

const { getToken, fetchAuthQuery, fetchAuthMutation } = inner

export { handler, getToken, fetchAuthQuery, fetchAuthMutation }
