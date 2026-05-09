import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { leadStatus } from "./schema"

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    zip: v.string(),
    service: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leads", {
      ...args,
      status: "pending",
    })
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("leads"),
    status: leadStatus,
    vapiCallId: v.optional(v.string()),
    bookingKoalaId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await ctx.db.patch(id, patch)
  },
})
