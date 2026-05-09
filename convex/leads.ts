import { mutation, internalQuery, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { leadStatus } from "./schema"

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
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

export const getByVapiCallId = internalQuery({
  args: { vapiCallId: v.string() },
  handler: async (ctx, { vapiCallId }) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_vapi_call", (q) => q.eq("vapiCallId", vapiCallId))
      .first()
  },
})

export const patchByVapiCallId = internalMutation({
  args: {
    vapiCallId: v.string(),
    status: v.optional(leadStatus),
    bookingKoalaId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { vapiCallId, ...patch }) => {
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_vapi_call", (q) => q.eq("vapiCallId", vapiCallId))
      .first()
    if (!lead) return null
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    )
    await ctx.db.patch(lead._id, cleaned)
    return lead._id
  },
})
