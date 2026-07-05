import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export const leadStatus = v.union(
  v.literal("pending"),
  v.literal("calling"),
  v.literal("confirmed"),
  v.literal("email_sent"),
  v.literal("link_clicked"),
  v.literal("booked"),
  v.literal("declined"),
  v.literal("no_answer"),
  v.literal("failed"),
)

// ---- Outreach CRM ----

// Stage classification drives won/lost reporting and board colouring.
export const stageType = v.union(
  v.literal("active"),
  v.literal("won"),
  v.literal("lost"),
)

export const activityType = v.union(
  v.literal("created"),
  v.literal("import"),
  v.literal("stage_change"),
  v.literal("note"),
  v.literal("call"),
  v.literal("email"),
  v.literal("tag"),
)

export const jobStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("done"),
  v.literal("error"),
)

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    zip: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    service: v.string(),
    status: leadStatus,
    vapiCallId: v.optional(v.string()),
    bookingKoalaId: v.optional(v.string()),
    notes: v.optional(v.string()),
    pendingBookingPayload: v.optional(v.any()),
    pendingAttempts: v.optional(v.number()),
    clickToken: v.optional(v.string()),
    emailSentAt: v.optional(v.number()),
    emailMessageId: v.optional(v.string()),
    clickedAt: v.optional(v.number()),
    clickIp: v.optional(v.string()),
    clickUserAgent: v.optional(v.string()),
  })
    .index("by_phone", ["phone"])
    .index("by_status", ["status"])
    .index("by_vapi_call", ["vapiCallId"])
    .index("by_pending_attempts", ["pendingAttempts"])
    .index("by_click_token", ["clickToken"]),

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

  // Global contact identity. Deduped by lowercased email (emailKey); phone is a
  // fallback key for rows that arrive without an email. Custom holds arbitrary
  // imported columns; searchText is the concatenated field the search index uses.
  contacts: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    title: v.optional(v.string()),
    emailKey: v.optional(v.string()),
    phoneKey: v.optional(v.string()),
    searchText: v.string(),
    custom: v.optional(v.record(v.string(), v.string())),
    tags: v.array(v.string()),
    hasEmail: v.boolean(),
    hasPhone: v.boolean(),
  })
    .index("by_email", ["emailKey"])
    .index("by_phone", ["phoneKey"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["hasEmail", "hasPhone"],
    }),

  // A named outreach batch. contactCount is denormalised to avoid full scans.
  campaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    contactCount: v.number(),
    archivedAt: v.optional(v.number()),
  }),

  // Pipeline stages. campaignId undefined = the editable global default template
  // that new campaigns are seeded from; otherwise the campaign's own columns.
  stages: defineTable({
    campaignId: v.optional(v.id("campaigns")),
    name: v.string(),
    order: v.number(),
    color: v.string(),
    type: stageType,
    // Denormalised membership count so boards render column totals without
    // scanning. Optional/absent = 0. Maintained by import, move, and delete.
    count: v.optional(v.number()),
  }).index("by_campaign", ["campaignId"]),

  // The join: stage lives here, so one contact can sit at different stages in
  // different campaigns.
  memberships: defineTable({
    contactId: v.id("contacts"),
    campaignId: v.id("campaigns"),
    stageId: v.id("stages"),
    addedAt: v.number(),
  })
    .index("by_campaign_stage", ["campaignId", "stageId"])
    .index("by_campaign", ["campaignId"])
    .index("by_contact", ["contactId"])
    .index("by_contact_campaign", ["contactId", "campaignId"]),

  // Per-contact timeline.
  activities: defineTable({
    contactId: v.id("contacts"),
    campaignId: v.optional(v.id("campaigns")),
    type: activityType,
    body: v.optional(v.string()),
    meta: v.optional(v.any()),
    at: v.number(),
    by: v.optional(v.string()),
  })
    .index("by_contact", ["contactId"])
    .index("by_campaign", ["campaignId"]),

  // Progress tracking for chunked import + bulk jobs (UI subscribes live).
  importJobs: defineTable({
    kind: v.union(v.literal("import"), v.literal("bulk")),
    campaignId: v.optional(v.id("campaigns")),
    action: v.optional(v.string()),
    status: jobStatus,
    total: v.number(),
    processed: v.number(),
    inserted: v.number(),
    updated: v.number(),
    skipped: v.number(),
    invalid: v.number(),
    error: v.optional(v.string()),
  }),
})
