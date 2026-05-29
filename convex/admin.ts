import { v } from "convex/values"
import { action, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { requireAdmin } from "./auth"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
function pctDelta(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100
  return ((current - prior) / prior) * 100
}

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const all = await ctx.db.query("leads").collect()
    const now = Date.now()
    const thisWeek = all.filter((l) => l._creationTime > now - WEEK_MS)
    const lastWeek = all.filter(
      (l) =>
        l._creationTime > now - 2 * WEEK_MS && l._creationTime <= now - WEEK_MS,
    )

    const totalLeads = all.length
    const totalLeadsPrior = all.length - thisWeek.length
    const booked = all.filter((l) => l.status === "booked").length
    const bookedThisWeek = thisWeek.filter((l) => l.status === "booked").length
    const bookedLastWeek = lastWeek.filter((l) => l.status === "booked").length
    const conversionRate = totalLeads > 0 ? (booked / totalLeads) * 100 : 0
    const conversionPrior =
      totalLeadsPrior > 0
        ? ((booked - bookedThisWeek) / totalLeadsPrior) * 100
        : 0

    return {
      totalLeads: {
        value: totalLeads,
        deltaPct: pctDelta(thisWeek.length, lastWeek.length),
      },
      bookings: {
        value: booked,
        deltaPct: pctDelta(bookedThisWeek, bookedLastWeek),
      },
      conversion: {
        value: conversionRate,
        deltaPct: conversionRate - conversionPrior,
      },
    }
  },
})

const optionalStatus = v.optional(
  v.union(
    v.literal("all"),
    v.literal("pending"),
    v.literal("calling"),
    v.literal("confirmed"),
    v.literal("email_sent"),
    v.literal("link_clicked"),
    v.literal("booked"),
    v.literal("declined"),
    v.literal("no_answer"),
    v.literal("failed"),
  ),
)

export const leadsByMonth = query({
  args: { months: v.optional(v.number()), status: optionalStatus },
  handler: async (ctx, { months = 6, status }) => {
    await requireAdmin(ctx)
    const rows = await ctx.db.query("leads").collect()
    const all = status && status !== "all"
      ? rows.filter((r) => r.status === status)
      : rows
    const now = new Date()
    const buckets: Array<{
      label: string
      year: number
      month: number
      count: number
    }> = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        label: MONTH_LABELS[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
      })
    }
    for (const lead of all) {
      const d = new Date(lead._creationTime)
      const bucket = buckets.find(
        (b) => b.year === d.getFullYear() && b.month === d.getMonth(),
      )
      if (bucket) bucket.count++
    }
    return buckets
  },
})

// Returns raw lead timestamps so the client can bucket them in the viewer's
// local timezone. Includes every lead (no vapiCallId filter) so the heatmap
// always reflects real form activity.
export const leadHeatmap = query({
  args: { limit: v.optional(v.number()), status: optionalStatus },
  handler: async (ctx, { limit = 500, status }) => {
    await requireAdmin(ctx)
    let rows
    if (status && status !== "all") {
      rows = await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit)
    } else {
      rows = await ctx.db.query("leads").order("desc").take(limit)
    }
    return rows.map((l) => l._creationTime)
  },
})

export const recentLeads = query({
  args: { limit: v.optional(v.number()), status: optionalStatus },
  handler: async (ctx, { limit = 8, status }) => {
    await requireAdmin(ctx)
    let rows
    if (status && status !== "all") {
      rows = await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit)
    } else {
      rows = await ctx.db.query("leads").order("desc").take(limit)
    }
    return rows.map((l) => ({
      _id: l._id,
      _creationTime: l._creationTime,
      name: l.name,
      service: l.service,
      status: l.status,
      phone: l.phone,
      zip: l.zip,
      notes: l.notes,
    }))
  },
})

export const bestService = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const all = await ctx.db.query("leads").collect()
    const counts = new Map<string, { total: number; booked: number }>()
    for (const lead of all) {
      const c = counts.get(lead.service) ?? { total: 0, booked: 0 }
      c.total++
      if (lead.status === "booked") c.booked++
      counts.set(lead.service, c)
    }
    const ranked = [...counts.entries()]
      .map(([service, c]) => ({ service, ...c }))
      .sort((a, b) => b.booked - a.booked || b.total - a.total)
    return ranked.slice(0, 5)
  },
})

export const pendingBookings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const rows = await ctx.db
      .query("leads")
      .withIndex("by_pending_attempts", (q) => q.gt("pendingAttempts", 0))
      .take(20)
    return rows
      .filter((r) => r.pendingBookingPayload !== undefined)
      .map((r) => ({
        _id: r._id,
        name: r.name,
        service: r.service,
        attempts: r.pendingAttempts ?? 0,
        notes: r.notes,
        _creationTime: r._creationTime,
      }))
  },
})

const leadStatusFilter = v.union(
  v.literal("all"),
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

export const listLeads = query({
  args: {
    status: v.optional(leadStatusFilter),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, search, limit = 100 }) => {
    await requireAdmin(ctx)
    let rows
    if (status && status !== "all") {
      rows = await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit)
    } else {
      rows = await ctx.db.query("leads").order("desc").take(limit)
    }
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.service.toLowerCase().includes(q) ||
          r.zip.includes(q),
      )
    }
    return rows
  },
})

export const listBookings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query("leads")
      .withIndex("by_status", (q) => q.eq("status", "booked"))
      .order("desc")
      .take(limit)
  },
})

export const resendBookingEmail = action({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }): Promise<{ ok: boolean; error?: string; messageId?: string }> => {
    await requireAdmin(ctx)
    return await ctx.runAction(internal.email.sendBookingEmail, { leadId })
  },
})
