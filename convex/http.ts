import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"

const http = httpRouter()

const MAKE_BK_WEBHOOK_URL = process.env.MAKE_BK_WEBHOOK_URL
const VAPI_SERVER_SECRET = process.env.VAPI_SERVER_SECRET

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
    if (VAPI_SERVER_SECRET) {
      const provided = req.headers.get("x-vapi-secret")
      if (provided !== VAPI_SERVER_SECRET) {
        return new Response("forbidden", { status: 403 })
      }
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

        const args = (tc.function?.arguments ?? {}) as {
          firstName?: string
          lastName?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          country?: string
          service?: string
          preferredDateTime?: string
          notes?: string
        }

        const bkResult = await postToMake({
          ...args,
          country: args.country ?? "USA",
          source: "Vapi",
          callId,
        })

        if (callId && bkResult.ok) {
          await ctx.runMutation(internal.leads.patchByVapiCallId, {
            vapiCallId: callId,
            status: "booked",
            bookingKoalaId: bkResult.bookingId,
            notes: args.notes,
          })
        }

        results.push({
          toolCallId: tc.id,
          result: bkResult.ok
            ? `Booking received. Our team will confirm details shortly.`
            : `Booking failed: ${bkResult.error}`,
        })
      }

      return Response.json({ results })
    }

    if (message.type === "end-of-call-report" && callId) {
      const reason = message.endedReason ?? message.call?.endedReason ?? ""
      const status = mapEndReason(reason)
      await ctx.runMutation(internal.leads.patchByVapiCallId, {
        vapiCallId: callId,
        status,
        notes: message.analysis?.summary,
      })
      return Response.json({ ok: true })
    }

    return Response.json({ ok: true })
  }),
})

async function postToMake(
  body: Record<string, unknown>,
): Promise<{ ok: true; bookingId?: string } | { ok: false; error: string }> {
  if (!MAKE_BK_WEBHOOK_URL) {
    return { ok: false, error: "MAKE_BK_WEBHOOK_URL not set" }
  }
  try {
    const res = await fetch(MAKE_BK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return { ok: false, error: `Make returned ${res.status}` }
    const text = await res.text()
    let bookingId: string | undefined
    try {
      const json = JSON.parse(text) as { id?: string; bookingId?: string }
      bookingId = json.bookingId ?? json.id
    } catch {
      // Make often returns "Accepted" as plain text — that's fine.
    }
    return { ok: true, bookingId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

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

export default http
