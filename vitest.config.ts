import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

const srcAlias = {
  "#": fileURLToPath(new URL("./src", import.meta.url)),
  "@": fileURLToPath(new URL("./src", import.meta.url)),
}

// Kept deliberately separate from vite.config.ts: the TanStack Start / Nitro
// plugins there are not test-friendly. Two projects — Convex functions run in
// the edge-runtime VM that convex-test expects, UI runs in jsdom.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "convex",
          include: ["convex/**/*.test.ts"],
          environment: "edge-runtime",
          server: { deps: { inline: ["convex-test"] } },
        },
      },
      {
        plugins: [react()],
        resolve: { alias: srcAlias },
        test: {
          name: "ui",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
})
