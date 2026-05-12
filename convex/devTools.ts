import { v } from "convex/values"
import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { internalMutation } from "./_generated/server"
import { rateLimiter } from "./bookings"

// Wipes every row from `leads` and `events`. Invoke via:
//   npx convex run devTools:wipeAll
// Does NOT touch the Better Auth or rate-limiter component databases. Use the
// dedicated rate-limit resets below for those.
export const wipeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect()
    for (const row of leads) await ctx.db.delete(row._id)
    const events = await ctx.db.query("events").collect()
    for (const row of events) await ctx.db.delete(row._id)
    return { deletedLeads: leads.length, deletedEvents: events.length }
  },
})

// Reset every rate-limit bucket for a given phone (E.164-normalized). Invoke:
//   npx convex run devTools:clearPhoneRateLimit '{"phone":"4049907052"}'
export const clearPhoneRateLimit = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const parsed = parsePhoneNumberFromString(phone, "US")
    const key = parsed?.isValid() ? parsed.number : phone
    await rateLimiter.reset(ctx, "bookingByPhone", { key })
    return { reset: key }
  },
})

export const clearEmailRateLimit = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const key = email.trim().toLowerCase()
    await rateLimiter.reset(ctx, "bookingByEmail", { key })
    return { reset: key }
  },
})

export const clearGlobalRateLimit = internalMutation({
  args: {},
  handler: async (ctx) => {
    await rateLimiter.reset(ctx, "bookingGlobal")
    return { reset: "bookingGlobal" }
  },
})
