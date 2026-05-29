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
async function handler(request: Request): Promise<Response> {
  try {
    return await inner.handler(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack ?? "" : ""
    // eslint-disable-next-line no-console
    console.error("[auth-proxy] handler threw:", message, stack)
    return new Response(
      JSON.stringify({
        status: 500,
        message: "auth proxy threw",
        detail: message,
        stack: stack.split("\n").slice(0, 4).join("\n"),
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }
}

const { getToken, fetchAuthQuery, fetchAuthMutation } = inner

export { handler, getToken, fetchAuthQuery, fetchAuthMutation }
