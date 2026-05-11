import { betterAuth } from "better-auth/minimal"
import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "./auth.config"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server"

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000"
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? siteUrl)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
    plugins: [convex({ authConfig })],
  })
}

export const { getAuthUser } = authComponent.clientApi()

export async function requireAdmin(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) throw new Error("Unauthorized")
  const email = (user.email ?? "").toLowerCase()
  if (adminEmails.length === 0 || !adminEmails.includes(email)) {
    throw new Error("Forbidden")
  }
  return user
}
