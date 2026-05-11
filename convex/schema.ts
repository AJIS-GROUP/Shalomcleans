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
    email: v.string(),
    phone: v.string(),
    zip: v.string(),
    service: v.string(),
    status: leadStatus,
    vapiCallId: v.optional(v.string()),
    bookingKoalaId: v.optional(v.string()),
    notes: v.optional(v.string()),
    pendingBookingPayload: v.optional(v.any()),
    pendingAttempts: v.optional(v.number()),
  })
    .index("by_phone", ["phone"])
    .index("by_status", ["status"])
    .index("by_vapi_call", ["vapiCallId"])
    .index("by_pending_attempts", ["pendingAttempts"]),

  events: defineTable({
    kind: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
      v.literal("success"),
    ),
    message: v.string(),
    leadId: v.optional(v.id("leads")),
    vapiCallId: v.optional(v.string()),
    data: v.optional(v.any()),
  })
    .index("by_kind", ["kind"])
    .index("by_severity", ["severity"])
    .index("by_lead", ["leadId"]),
})
