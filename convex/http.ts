import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { authComponent, createAuth } from "./auth"

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

const VAPI_SERVER_SECRET = process.env.VAPI_SERVER_SECRET
const BOOKING_KOALA_URL = "https://shalomcleans.bookingkoala.com/booknow"

const MAX_NOTES = 500

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
        if (tc.function?.name !== "confirmBookingEmail") {
          results.push({ toolCallId: tc.id, result: "Unknown tool" })
          continue
        }
        if (!callId) {
          results.push({
            toolCallId: tc.id,
            result: "Missing call id — cannot link to a lead.",
          })
          continue
        }

        const args = (tc.function?.arguments ?? {}) as Record<string, unknown>
        const rawNotes = typeof args.notes === "string" ? args.notes : ""
        const notes = rawNotes
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .slice(0, MAX_NOTES)

        await ctx.runMutation(internal.events.record, {
          kind: "vapi_tool_call",
          severity: "info",
          message: "Vapi assistant invoked confirmBookingEmail",
          vapiCallId: callId,
          data: { notes: notes.slice(0, 200) },
        })

        const leadId = await ctx.runMutation(
          internal.leads.markConfirmedByVapiCallId,
          { vapiCallId: callId, notes: notes || undefined },
        )

        if (!leadId) {
          results.push({
            toolCallId: tc.id,
            result: "Lead not found for this call.",
          })
          continue
        }

        await ctx.scheduler.runAfter(0, internal.email.sendBookingEmail, {
          leadId,
        })

        results.push({
          toolCallId: tc.id,
          result:
            "Confirmed. The booking link email is on its way to the customer.",
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

// Per-lead booking link redirect. Resolves the click token, marks the lead
// as link_clicked, then 302s to BookingKoala. Failures still redirect so the
// customer is never left staring at an error page.
http.route({
  path: "/r/book",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    return await handleBookingClick(ctx, req)
  }),
})

http.route({
  pathPrefix: "/r/book/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    return await handleBookingClick(ctx, req)
  }),
})

async function handleBookingClick(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  req: Request,
): Promise<Response> {
  const url = new URL(req.url)
  // Token is everything after /r/book/.
  const tokenMatch = url.pathname.match(/\/r\/book\/([^/]+)/)
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : ""

  if (!token || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return Response.redirect(BOOKING_KOALA_URL, 302)
  }

  const lead = await ctx.runQuery(internal.email.getLeadByToken, { token })
  if (!lead) {
    return Response.redirect(BOOKING_KOALA_URL, 302)
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  const userAgent = req.headers.get("user-agent") ?? undefined

  await ctx.runMutation(internal.email.markLinkClicked, {
    leadId: lead._id,
    ip,
    userAgent,
  })

  return Response.redirect(BOOKING_KOALA_URL, 302)
}

function mapEndReason(
  reason: string,
): "declined" | "no_answer" | "failed" | "calling" {
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
