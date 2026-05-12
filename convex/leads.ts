import { internalQuery, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { leadStatus } from "./schema"
import { logEvent } from "./events"

const NOTES_MAX = 500
const BK_ID_RE = /^[A-Za-z0-9_-]{1,64}$/

function clampNotes(s: string | undefined) {
  if (!s) return s
  // Strip control chars and clamp length.
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, NOTES_MAX)
}

function validateBookingKoalaId(id: string | undefined) {
  if (!id) return id
  if (!BK_ID_RE.test(id)) throw new Error("Invalid bookingKoalaId")
  return id
}

export const createInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    zip: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    service: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("leads", {
      ...args,
      status: "pending",
    })
    await logEvent(ctx, {
      kind: "lead_created",
      severity: "info",
      message: `New lead from ${args.name} — ${args.service}`,
      leadId: id,
    })
    return id
  },
})

export const updateStatusInternal = internalMutation({
  args: {
    id: v.id("leads"),
    status: leadStatus,
    vapiCallId: v.optional(v.string()),
    bookingKoalaId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const cleaned: Record<string, unknown> = {}
    if (patch.status !== undefined) cleaned.status = patch.status
    if (patch.vapiCallId !== undefined) cleaned.vapiCallId = patch.vapiCallId
    if (patch.bookingKoalaId !== undefined)
      cleaned.bookingKoalaId = validateBookingKoalaId(patch.bookingKoalaId)
    if (patch.notes !== undefined) cleaned.notes = clampNotes(patch.notes)
    await ctx.db.patch(id, cleaned)
    if (patch.status === "calling" && patch.vapiCallId) {
      await logEvent(ctx, {
        kind: "vapi_call_started",
        severity: "info",
        message: "Outbound Vapi call initiated",
        leadId: id,
        vapiCallId: patch.vapiCallId,
      })
    }
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

const TERMINAL: ReadonlyArray<"booked" | "declined"> = ["booked", "declined"]

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
    const cleaned: Record<string, unknown> = {}
    if (patch.status !== undefined && !TERMINAL.includes(lead.status as "booked" | "declined")) {
      cleaned.status = patch.status
    }
    if (patch.bookingKoalaId !== undefined) {
      cleaned.bookingKoalaId = validateBookingKoalaId(patch.bookingKoalaId)
    }
    if (patch.notes !== undefined) {
      cleaned.notes = clampNotes(patch.notes)
    }
    await ctx.db.patch(lead._id, cleaned)
    return lead._id
  },
})

export const markBooked = internalMutation({
  args: {
    vapiCallId: v.string(),
    bookingKoalaId: v.optional(v.string()),
  },
  handler: async (ctx, { vapiCallId, bookingKoalaId }) => {
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_vapi_call", (q) => q.eq("vapiCallId", vapiCallId))
      .first()
    if (!lead) return null
    const cleanId = validateBookingKoalaId(bookingKoalaId)
    await ctx.db.patch(lead._id, {
      status: "booked",
      ...(cleanId ? { bookingKoalaId: cleanId } : {}),
      pendingBookingPayload: undefined,
      pendingAttempts: undefined,
    })
    await logEvent(ctx, {
      kind: "booking_confirmed",
      severity: "success",
      message: cleanId
        ? `Booking confirmed (BK ${cleanId})`
        : "Booking confirmed (no BK id returned)",
      leadId: lead._id,
      vapiCallId,
      data: { bookingKoalaId: cleanId },
    })
    return lead._id
  },
})

export const queuePendingBooking = internalMutation({
  args: {
    vapiCallId: v.string(),
    payload: v.any(),
    lastError: v.string(),
  },
  handler: async (ctx, { vapiCallId, payload, lastError }) => {
    const lead = await ctx.db
      .query("leads")
      .withIndex("by_vapi_call", (q) => q.eq("vapiCallId", vapiCallId))
      .first()
    if (!lead) return null
    const attempts = (lead.pendingAttempts ?? 0) + 1
    await ctx.db.patch(lead._id, {
      pendingBookingPayload: payload,
      pendingAttempts: attempts,
      notes: clampNotes(`Make booking pending — ${lastError}`),
    })
    await logEvent(ctx, {
      kind: "make_dispatch_failed",
      severity: "warn",
      message: `Make dispatch failed (attempt ${attempts}): ${lastError}`.slice(0, 500),
      leadId: lead._id,
      vapiCallId,
      data: { attempts, lastError: lastError.slice(0, 500) },
    })
    return lead._id
  },
})

const MAX_ATTEMPTS = 8

export const listPendingBookings = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("leads")
      .withIndex("by_pending_attempts", (q) => q.gt("pendingAttempts", 0))
      .take(limit ?? 25)
    return rows.filter(
      (r) =>
        r.pendingBookingPayload !== undefined &&
        (r.pendingAttempts ?? 0) < MAX_ATTEMPTS,
    )
  },
})
