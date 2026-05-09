import { ConvexHttpClient } from "convex/browser"

const url = process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL

if (!url) {
  throw new Error("VITE_CONVEX_URL is not set")
}

export const convex = new ConvexHttpClient(url)
