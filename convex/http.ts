import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { authComponent, createAuth } from "./auth"

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

const VAPI_SERVER_SECRET = process.env.VAPI_SERVER_SECRET

const ALLOWED_BOOKING_KEYS = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "service",
  "preferredDateTime",
  "notes",
])
const MAX_STR = 500

function sanitizeBookingArgs(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!ALLOWED_BOOKING_KEYS.has(k)) continue
    if (typeof v !== "string") continue
    const cleaned = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, MAX_STR)
    if (cleaned.length === 0) continue
    out[k] = cleaned
  }
  return out
}

type VapiToolCall = {
  id: string
  function?: { name?: string; arguments?: Record<string, unknown> }
}

type VapiMessage = {
  type?: string
  call?: { id?: string; endedReason?: string }
  toolCallList?: Array<VapiToolCall>
  toolCalls?: Array<VapiToolCall>
  analysis?: { summary?: string }
  endedReason?: string
}

http.route({
  path: "/vapi",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Fail closed: refuse if no secret is configured.
    if (!VAPI_SERVER_SECRET) {
      return new Response("server misconfigured", { status: 503 })
    }
    const provided = req.headers.get("x-vapi-secret")
    if (!provided || !timingSafeEqual(provided, VAPI_SERVER_SECRET)) {
      return new Response("forbidden", { status: 403 })
    }

    const payload = (await req.json().catch(() => ({}))) as {
      message?: VapiMessage
    }
    const message = payload.message ?? {}
    const callId = message.call?.id

    if (message.type === "tool-calls") {
      const calls = message.toolCallList ?? message.toolCalls ?? []
      const results = []

      for (const tc of calls) {
        if (tc.function?.name !== "bookAppointment") {
          results.push({ toolCallId: tc.id, result: "Unknown tool" })
          continue
        }

        const rawArgs = (tc.function?.arguments ?? {}) as Record<string, unknown>
        const safeArgs = sanitizeBookingArgs(rawArgs)
        const bookingPayload = {
          ...safeArgs,
          country: safeArgs.country ?? "USA",
          source: "Vapi",
          callId,
        }

        await ctx.runMutation(internal.events.record, {
          kind: "vapi_tool_call",
          severity: "info",
          message: "Vapi assistant invoked bookAppointment",
          vapiCallId: callId,
          data: { args: safeArgs },
        })

        await ctx.scheduler.runAfter(0, internal.bookings.sendToMake, {
          payload: bookingPayload,
          vapiCallId: callId,
        })

        results.push({
          toolCallId: tc.id,
          result:
            "Booking received. Our team will confirm the details with you shortly.",
        })
      }

      return Response.json({ results })
    }

    if (message.type === "end-of-call-report" && callId) {
      const reason = (message.endedReason ?? message.call?.endedReason ?? "")
        .toString()
        .slice(0, 200)
      const status = mapEndReason(reason)
      await ctx.runMutation(internal.leads.patchByVapiCallId, {
        vapiCallId: callId,
        status,
        notes: message.analysis?.summary?.toString().slice(0, 500),
      })
      await ctx.runMutation(internal.events.record, {
        kind: "vapi_end_of_call",
        severity:
          status === "failed"
            ? "error"
            : status === "no_answer" || status === "declined"
              ? "warn"
              : "info",
        message: `Call ended: ${reason || "unknown"}`,
        vapiCallId: callId,
        data: { reason, status, summary: message.analysis?.summary?.toString().slice(0, 500) },
      })
      return Response.json({ ok: true })
    }

    return Response.json({ ok: true })
  }),
})

function mapEndReason(
  reason: string,
): "booked" | "declined" | "no_answer" | "failed" | "calling" {
  const r = reason.toLowerCase()
  if (r.includes("customer-ended-call") || r.includes("assistant-ended-call")) {
    return "calling"
  }
  if (r.includes("no-answer") || r.includes("voicemail")) return "no_answer"
  if (r.includes("declined") || r.includes("rejected")) return "declined"
  if (r.includes("error") || r.includes("failed")) return "failed"
  return "calling"
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export default http
