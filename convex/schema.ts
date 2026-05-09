import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export const leadStatus = v.union(
  v.literal("pending"),
  v.literal("calling"),
  v.literal("booked"),
  v.literal("declined"),
  v.literal("no_answer"),
  v.literal("failed"),
)

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    phone: v.string(),
    zip: v.string(),
    service: v.string(),
    status: leadStatus,
    vapiCallId: v.optional(v.string()),
    bookingKoalaId: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_phone", ["phone"])
    .index("by_status", ["status"])
    .index("by_vapi_call", ["vapiCallId"]),
})
