import { v } from "convex/values"
import { internalMutation, query, type MutationCtx } from "./_generated/server"
import { requireAdmin } from "./auth"

const ALLOWED_KINDS = [
  "lead_created",
  "vapi_call_started",
  "vapi_tool_call",
  "vapi_end_of_call",
  "make_dispatch_success",
  "make_dispatch_failed",
  "booking_confirmed",
  "rate_limited",
] as const

const severity = v.union(
  v.literal("info"),
  v.literal("warn"),
  v.literal("error"),
  v.literal("success"),
)

export async function logEvent(
  ctx: MutationCtx,
  args: {
    kind: string
    severity: "info" | "warn" | "error" | "success"
    message: string
    leadId?: string
    vapiCallId?: string
    data?: unknown
  },
) {
  await ctx.db.insert("events", {
    kind: args.kind,
    severity: args.severity,
    message: args.message,
    leadId: args.leadId as never,
    vapiCallId: args.vapiCallId,
    data: args.data,
  })
}

export const record = internalMutation({
  args: {
    kind: v.string(),
    severity,
    message: v.string(),
    leadId: v.optional(v.id("leads")),
    vapiCallId: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", args)
  },
})

export const list = query({
  args: {
    limit: v.optional(v.number()),
    severity: v.optional(severity),
    kind: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, severity: sev, kind }) => {
    await requireAdmin(ctx)
    const bounded = Math.min(Math.max(1, limit), 200)
    if (kind && !ALLOWED_KINDS.includes(kind as (typeof ALLOWED_KINDS)[number])) {
      throw new Error("Invalid kind")
    }
    let query
    if (kind) {
      query = ctx.db.query("events").withIndex("by_kind", (q) => q.eq("kind", kind))
    } else if (sev) {
      query = ctx.db
        .query("events")
        .withIndex("by_severity", (q) => q.eq("severity", sev))
    } else {
      query = ctx.db.query("events")
    }
    return await query.order("desc").take(bounded)
  },
})

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000

export const purgeOld = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS
    const old = await ctx.db
      .query("events")
      .filter((q) => q.lt(q.field("_creationTime"), cutoff))
      .take(500)
    for (const row of old) {
      await ctx.db.delete(row._id)
    }
    return { deleted: old.length }
  },
})
