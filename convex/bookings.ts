import { v, ConvexError } from "convex/values"
import {
  action,
  internalAction,
  type ActionCtx,
} from "./_generated/server"
import { internal, components } from "./_generated/api"
import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { RateLimiter, MINUTE, HOUR, DAY } from "@convex-dev/rate-limiter"

const MAKE_BK_WEBHOOK_URL = process.env.MAKE_BK_WEBHOOK_URL
const MAKE_SHARED_SECRET = process.env.MAKE_SHARED_SECRET
const VAPI_API = "https://api.vapi.ai"

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per phone number: max 5 submissions per day, burst up to 2 in quick succession.
  bookingByPhone: { kind: "token bucket", rate: 5, period: DAY, capacity: 2 },
  // Per email: max 10 per day, burst up to 3.
  bookingByEmail: { kind: "token bucket", rate: 10, period: DAY, capacity: 3 },
  // Global guard: 60 submissions / minute across the whole deployment.
  bookingGlobal: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 30 },
  // Generic fallback so the limit refills slowly.
  _hourly: { kind: "fixed window", rate: 1000, period: HOUR },
})

type DispatchResult =
  | { ok: true; bookingId?: string }
  | { ok: false; error: string }

// ---------------------- Public booking submission ----------------------

const submitArgs = {
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  zip: v.string(),
  service: v.string(),
}

export const submit = action({
  args: submitArgs,
  handler: async (ctx, args): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> => {
    // 1) Validate inputs (US phone, length caps, allow-list of services)
    const trimmedName = args.name.trim().slice(0, 100)
    const trimmedEmail = args.email.trim().toLowerCase().slice(0, 200)
    const trimmedZip = args.zip.trim()
    const trimmedService = args.service.trim()

    if (trimmedName.length < 2) {
      return { ok: false, error: "Name must be at least 2 characters" }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { ok: false, error: "Please enter a valid email" }
    }
    if (!/^\d{5}$/.test(trimmedZip)) {
      return { ok: false, error: "Please enter a valid 5-digit zip code" }
    }
    const ALLOWED_SERVICES = ["Standard", "Deep Clean", "Move-In/Out"]
    if (!ALLOWED_SERVICES.includes(trimmedService)) {
      return { ok: false, error: "Please select a valid service" }
    }
    const parsed = parsePhoneNumberFromString(args.phone, "US")
    if (!parsed?.isValid()) {
      return { ok: false, error: "Please enter a valid phone number" }
    }
    if (parsed.country !== "US") {
      return { ok: false, error: "Only US phone numbers are accepted at this time." }
    }
    const e164 = parsed.number

    // 2) Rate limit — global, per phone (5/day), per email (10/day)
    const globalCheck = await rateLimiter.limit(ctx, "bookingGlobal")
    if (!globalCheck.ok) {
      await ctx.runMutation(internal.events.record, {
        kind: "rate_limited",
        severity: "warn",
        message: "Global booking rate limit hit",
      })
      return { ok: false, error: "Service is busy. Please try again shortly." }
    }
    const phoneCheck = await rateLimiter.limit(ctx, "bookingByPhone", { key: e164 })
    if (!phoneCheck.ok) {
      await ctx.runMutation(internal.events.record, {
        kind: "rate_limited",
        severity: "warn",
        message: `Phone rate limit hit: ${e164}`,
      })
      return { ok: false, error: "Too many requests for this phone number. Please try again later." }
    }
    const emailCheck = await rateLimiter.limit(ctx, "bookingByEmail", { key: trimmedEmail })
    if (!emailCheck.ok) {
      await ctx.runMutation(internal.events.record, {
        kind: "rate_limited",
        severity: "warn",
        message: `Email rate limit hit: ${trimmedEmail}`,
      })
      return { ok: false, error: "Too many requests for this email. Please try again later." }
    }

    // 3) Insert lead (internal mutation)
    const leadId = await ctx.runMutation(internal.leads.createInternal, {
      name: trimmedName,
      email: trimmedEmail,
      phone: e164,
      zip: trimmedZip,
      service: trimmedService,
    })

    // 4) Kick off outbound Vapi call. Don't block the response on transient errors.
    try {
      const result = await startOutboundCall({
        phoneNumber: e164,
        variables: {
          name: trimmedName,
          service: trimmedService,
          zip: trimmedZip,
        },
        metadata: { leadId },
      })

      if (result.skipped) {
        await ctx.runMutation(internal.leads.updateStatusInternal, {
          id: leadId,
          status: "pending",
          notes: `Vapi call skipped: ${result.reason}`,
        })
      } else {
        await ctx.runMutation(internal.leads.updateStatusInternal, {
          id: leadId,
          status: "calling",
          vapiCallId: result.callId,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await ctx.runMutation(internal.leads.updateStatusInternal, {
        id: leadId,
        status: "failed",
        notes: message.slice(0, 500),
      })
    }

    return { ok: true, leadId }
  },
})

// ---------------------- Outbound Vapi helper ----------------------

async function startOutboundCall(input: {
  phoneNumber: string
  variables: Record<string, string>
  metadata?: Record<string, unknown>
}): Promise<
  | { skipped: true; reason: string }
  | { skipped: false; callId?: string }
> {
  const key = process.env.VAPI_PRIVATE_KEY
  const assistantId = process.env.VAPI_ASSISTANT_ID
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID
  if (!key || !assistantId) {
    throw new ConvexError("Missing VAPI_PRIVATE_KEY or VAPI_ASSISTANT_ID")
  }
  if (!phoneNumberId) {
    return { skipped: true, reason: "VAPI_PHONE_NUMBER_ID not set" }
  }
  const res = await fetch(`${VAPI_API}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: input.phoneNumber },
      assistantOverrides: {
        variableValues: input.variables,
        metadata: input.metadata,
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new ConvexError(`Vapi call failed (${res.status}): ${body.slice(0, 200)}`)
  }
  const json = (await res.json()) as { id?: string }
  return { skipped: false, callId: json.id }
}

// ---------------------- Make.com dispatch (internal) ----------------------

async function dispatchBooking(
  ctx: ActionCtx,
  payload: Record<string, unknown>,
  vapiCallId: string | undefined,
): Promise<DispatchResult> {
  if (!MAKE_BK_WEBHOOK_URL) {
    const error = "MAKE_BK_WEBHOOK_URL not set"
    if (vapiCallId) {
      await ctx.runMutation(internal.leads.queuePendingBooking, {
        vapiCallId,
        payload,
        lastError: error,
      })
    }
    return { ok: false, error }
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const ts = Math.floor(Date.now() / 1000).toString()
  const body = JSON.stringify(payload)
  if (MAKE_SHARED_SECRET) {
    headers["x-shared-secret"] = MAKE_SHARED_SECRET
    headers["x-timestamp"] = ts
    headers["x-signature"] = await hmacSha256Hex(MAKE_SHARED_SECRET, `${ts}.${body}`)
  }

  try {
    const res = await fetch(MAKE_BK_WEBHOOK_URL, { method: "POST", headers, body })
    if (!res.ok) throw new Error(`Make returned ${res.status}`)

    const text = await res.text()
    let bookingId: string | undefined
    try {
      const json = JSON.parse(text) as { id?: string; bookingId?: string }
      bookingId = json.bookingId ?? json.id
    } catch {
      // plain-text response is acceptable
    }

    if (vapiCallId) {
      await ctx.runMutation(internal.leads.markBooked, {
        vapiCallId,
        bookingKoalaId: bookingId,
      })
    } else {
      await ctx.runMutation(internal.events.record, {
        kind: "make_dispatch_success",
        severity: "success",
        message: bookingId
          ? `Make dispatched booking (BK ${bookingId})`
          : "Make dispatched booking",
        data: { bookingId },
      })
    }
    return { ok: true, bookingId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    if (vapiCallId) {
      await ctx.runMutation(internal.leads.queuePendingBooking, {
        vapiCallId,
        payload,
        lastError: error,
      })
    }
    return { ok: false, error }
  }
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const sendToMake = internalAction({
  args: {
    payload: v.any(),
    vapiCallId: v.optional(v.string()),
  },
  handler: async (ctx, { payload, vapiCallId }): Promise<DispatchResult> => {
    return await dispatchBooking(ctx, payload, vapiCallId)
  },
})

export const retryPending = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number }> => {
    const pending = await ctx.runQuery(internal.leads.listPendingBookings, {})
    for (const lead of pending) {
      if (!lead.vapiCallId || !lead.pendingBookingPayload) continue
      await dispatchBooking(
        ctx,
        lead.pendingBookingPayload as Record<string, unknown>,
        lead.vapiCallId,
      )
    }
    return { processed: pending.length }
  },
})
