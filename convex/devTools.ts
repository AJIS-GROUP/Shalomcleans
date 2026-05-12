import { v } from "convex/values"
import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { internalMutation, mutation, type MutationCtx } from "./_generated/server"
import { rateLimiter } from "./bookings"
import { requireAdmin } from "./auth"

async function _wipeAll(ctx: MutationCtx) {
  const leads = await ctx.db.query("leads").collect()
  for (const row of leads) await ctx.db.delete(row._id)
  const events = await ctx.db.query("events").collect()
  for (const row of events) await ctx.db.delete(row._id)
  return { deletedLeads: leads.length, deletedEvents: events.length }
}

async function _clearPhoneRateLimit(ctx: MutationCtx, phone: string) {
  const parsed = parsePhoneNumberFromString(phone, "US")
  const key = parsed?.isValid() ? parsed.number : phone
  await rateLimiter.reset(ctx, "bookingByPhone", { key })
  return { reset: key }
}

async function _clearEmailRateLimit(ctx: MutationCtx, email: string) {
  const key = email.trim().toLowerCase()
  await rateLimiter.reset(ctx, "bookingByEmail", { key })
  return { reset: key }
}

async function _clearGlobalRateLimit(ctx: MutationCtx) {
  await rateLimiter.reset(ctx, "bookingGlobal")
  return { reset: "bookingGlobal" }
}

// ----- Internal (CLI) -----
// Invoke via: npx convex run devTools:wipeAll
export const wipeAll = internalMutation({
  args: {},
  handler: (ctx) => _wipeAll(ctx),
})
export const clearPhoneRateLimit = internalMutation({
  args: { phone: v.string() },
  handler: (ctx, { phone }) => _clearPhoneRateLimit(ctx, phone),
})
export const clearEmailRateLimit = internalMutation({
  args: { email: v.string() },
  handler: (ctx, { email }) => _clearEmailRateLimit(ctx, email),
})
export const clearGlobalRateLimit = internalMutation({
  args: {},
  handler: (ctx) => _clearGlobalRateLimit(ctx),
})

// ----- Public (dashboard, requires admin) -----
export const wipeAllAdmin = mutation({
  args: { confirm: v.string() },
  handler: async (ctx, { confirm }) => {
    await requireAdmin(ctx)
    if (confirm !== "WIPE") throw new Error("Type WIPE to confirm")
    return _wipeAll(ctx)
  },
})
export const clearPhoneRateLimitAdmin = mutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    await requireAdmin(ctx)
    return _clearPhoneRateLimit(ctx, phone)
  },
})
export const clearEmailRateLimitAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireAdmin(ctx)
    return _clearEmailRateLimit(ctx, email)
  },
})
export const clearGlobalRateLimitAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return _clearGlobalRateLimit(ctx)
  },
})
