import { v } from "convex/values"
import { action } from "./_generated/server"
import { requireAdmin } from "./auth"

const VAPI_API = "https://api.vapi.ai"

type VapiCall = {
  id: string
  type?: string
  status?: string
  endedReason?: string
  startedAt?: string
  endedAt?: string
  cost?: number
  costBreakdown?: Record<string, number>
  customer?: { number?: string; name?: string }
  phoneNumberId?: string
  assistantId?: string
  analysis?: { summary?: string; structuredData?: Record<string, unknown> }
  transcript?: string
  recordingUrl?: string
  messages?: Array<{ role: string; message: string; time?: number }>
}

export const list = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }): Promise<{
    ok: boolean
    calls?: Array<VapiCall>
    error?: string
  }> => {
    await requireAdmin(ctx)
    const key = process.env.VAPI_PRIVATE_KEY
    if (!key) return { ok: false, error: "VAPI_PRIVATE_KEY not set" }
    try {
      const res = await fetch(`${VAPI_API}/call?limit=${limit}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!res.ok) {
        return { ok: false, error: `Vapi returned ${res.status}` }
      }
      const calls = (await res.json()) as Array<VapiCall>
      return { ok: true, calls }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  },
})

export const get = action({
  args: { id: v.string() },
  handler: async (ctx, { id }): Promise<{
    ok: boolean
    call?: VapiCall
    error?: string
  }> => {
    await requireAdmin(ctx)
    const key = process.env.VAPI_PRIVATE_KEY
    if (!key) return { ok: false, error: "VAPI_PRIVATE_KEY not set" }
    try {
      const res = await fetch(`${VAPI_API}/call/${id}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!res.ok) {
        return { ok: false, error: `Vapi returned ${res.status}` }
      }
      const call = (await res.json()) as VapiCall
      return { ok: true, call }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  },
})
