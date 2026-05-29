import { v, ConvexError } from "convex/values"
import { action } from "./_generated/server"
import { internal, components } from "./_generated/api"
import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { RateLimiter, MINUTE, HOUR, DAY } from "@convex-dev/rate-limiter"

const VAPI_API = "https://api.vapi.ai"
const META_GRAPH_API = "https://graph.facebook.com/v21.0"

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per phone: 50 / day, burst of 20.
  bookingByPhone: { kind: "token bucket", rate: 50, period: DAY, capacity: 20 },
  // Per email: 80 / day, burst of 25.
  bookingByEmail: { kind: "token bucket", rate: 80, period: DAY, capacity: 25 },
  // Global guard: 300 / minute across the whole deployment, burst of 150.
  bookingGlobal: { kind: "token bucket", rate: 300, period: MINUTE, capacity: 150 },
  // Generic fallback so the limit refills slowly.
  _hourly: { kind: "fixed window", rate: 5000, period: HOUR },
})

// ---------------------- Public booking submission ----------------------

const submitArgs = {
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  zip: v.string(),
  address: v.string(),
  service: v.string(),
}

export const submit = action({
  args: submitArgs,
  handler: async (ctx, args): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> => {
    // 1) Validate inputs (US phone, length caps, allow-list of services)
    const trimmedName = args.name.trim().slice(0, 100)
    const trimmedEmail = args.email.trim().toLowerCase().slice(0, 200)
    const trimmedZip = args.zip.trim()
    const trimmedAddress = args.address.trim().slice(0, 200)
    const trimmedService = args.service.trim()

    if (trimmedAddress.length < 5) {
      return { ok: false, error: "Please enter your street address" }
    }

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

    // 3) Insert lead (internal mutation). Address is trusted as typed — the
    //    Vapi agent confirms it on the call.
    const leadId = await ctx.runMutation(internal.leads.createInternal, {
      name: trimmedName,
      email: trimmedEmail,
      phone: e164,
      zip: trimmedZip,
      address: trimmedAddress,
      service: trimmedService,
    })

    // 4) Fire Meta CAPI Lead event. Browser pixel fires the same event with the
    //    same event_id so Meta dedupes; CAPI recovers events lost to ad blockers
    //    and iOS 14 ATT. Failure here must not break the booking flow.
    try {
      const capiResult = await sendCapiLead({
        eventId: leadId,
        name: trimmedName,
        email: trimmedEmail,
        phone: e164,
        zip: trimmedZip,
        service: trimmedService,
      })
      if (!capiResult.ok) {
        await ctx.runMutation(internal.events.record, {
          kind: "meta_capi_failed",
          severity: "warn",
          message: `Meta CAPI Lead failed: ${capiResult.error}`,
          leadId,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await ctx.runMutation(internal.events.record, {
        kind: "meta_capi_failed",
        severity: "warn",
        message: `Meta CAPI Lead threw: ${message.slice(0, 300)}`,
        leadId,
      })
    }

    // 5) Kick off outbound Vapi call. Don't block the response on transient errors.
    try {
      const result = await startOutboundCall({
        phoneNumber: e164,
        customer: {
          name: trimmedName,
          email: trimmedEmail,
          phone: e164,
          service: trimmedService,
          address: trimmedAddress,
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

type CustomerInfo = {
  name: string
  email: string
  phone: string
  service: string
  address: string
  city?: string
  state?: string
  zip: string
}

function buildFirstMessage(c: CustomerInfo): string {
  const first = c.name.split(/\s+/)[0] || "there"
  return (
    `Hi ${first}, this is Sarah from Shalom Cleans calling about your ${c.service} cleaning request. ` +
    `Is this a good time to confirm a couple of details?`
  )
}

function buildSystemPrompt(c: CustomerInfo): string {
  const locality = [c.city, c.state].filter(Boolean).join(", ")
  const fullAddress = locality
    ? `${c.address}, ${locality} ${c.zip}`
    : `${c.address}, ${c.zip}`
  return [
    "You are Sarah, a warm and concise booking assistant for Shalom Cleans, a residential cleaning service in the United States.",
    "",
    "The customer just submitted a booking request on our website. You are returning the call to CONFIRM their intent. You do NOT schedule the appointment yourself — after you confirm, the customer will receive an email with a link to pick their preferred time and complete the booking.",
    "",
    "Customer info already on file (do NOT ask them to repeat these — confirm only):",
    `- Name: ${c.name}`,
    `- Phone: ${c.phone}`,
    `- Email: ${c.email}`,
    `- Service requested: ${c.service} cleaning`,
    `- Address: ${fullAddress}`,
    "",
    "Your job, in order:",
    "1. Greet them by first name and ask if it's a good time to talk for a minute.",
    "2. Confirm the service and the address out loud — wait for a yes.",
    "3. Ask if there are any special instructions for the cleaning team (pets, gate codes, problem areas, parking).",
    "4. Once they've confirmed and shared any notes, call the `confirmBookingEmail` tool with a single `notes` field (a short summary of any special instructions, or an empty string if there are none).",
    "5. After the tool returns, tell the customer: \"Perfect. I'm sending you an email right now with a link to complete your booking — you'll just tap it, pick your time, and you're all set. It should land in your inbox in the next minute or so.\" Then thank them and end the call warmly.",
    "",
    "Important rules:",
    "- Never promise a specific date or time — the customer picks that on the link.",
    "- Never quote prices.",
    "- The email link is required to finalize the booking. Make this clear without being pushy.",
    "- If they decline or hesitate, offer to send the email anyway so they can complete it when they're ready, then call `confirmBookingEmail` and end politely.",
    "- If they explicitly refuse to receive the email, do NOT call the tool — end the call politely.",
    "",
    "Style:",
    "- Speak naturally, no lists or bullet points out loud.",
    "- One short question at a time.",
  ].join("\n")
}

async function startOutboundCall(input: {
  phoneNumber: string
  customer: CustomerInfo
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

  const [firstName, ...rest] = input.customer.name.trim().split(/\s+/)
  const lastName = rest.join(" ")

  const res = await fetch(`${VAPI_API}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: input.phoneNumber, name: input.customer.name },
      assistantOverrides: {
        // Keep variable values too — if the dashboard prompt references {{name}}
        // or {{service}}, those still resolve. Our hard-coded overrides below
        // are the source of truth though.
        variableValues: {
          firstName,
          lastName,
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
          service: input.customer.service,
          address: input.customer.address,
          city: input.customer.city ?? "",
          state: input.customer.state ?? "",
          zip: input.customer.zip,
        },
        metadata: input.metadata,
        firstMessage: buildFirstMessage(input.customer),
        model: {
          // Vapi requires `provider` + `model` whenever the model object is
          // overridden — even if we only want to swap the system message.
          provider: process.env.VAPI_MODEL_PROVIDER ?? "openai",
          model: process.env.VAPI_MODEL_NAME ?? "gpt-4o-mini",
          messages: [
            { role: "system", content: buildSystemPrompt(input.customer) },
          ],
        },
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

// ---------------------- Meta Conversions API ----------------------

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function sendCapiLead(input: {
  eventId: string
  name: string
  email: string
  phone: string
  zip: string
  service: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  if (!pixelId || !accessToken) {
    return { ok: false, error: "META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set" }
  }

  const [firstName, ...rest] = input.name.trim().split(/\s+/)
  const lastName = rest.join(" ")
  const phoneDigits = input.phone.replace(/\D/g, "")

  const [em, ph, fn, ln, zp, country] = await Promise.all([
    sha256Hex(input.email.trim().toLowerCase()),
    sha256Hex(phoneDigits),
    sha256Hex(firstName.toLowerCase()),
    lastName ? sha256Hex(lastName.toLowerCase()) : Promise.resolve(""),
    sha256Hex(input.zip.trim()),
    sha256Hex("us"),
  ])

  const eventSourceUrl = process.env.SITE_URL ?? "https://shalomcleans.com"

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: {
          em: [em],
          ph: [ph],
          fn: [fn],
          ...(ln ? { ln: [ln] } : {}),
          zp: [zp],
          country: [country],
        },
        custom_data: {
          content_name: "Booking Request",
          content_category: input.service,
        },
      },
    ],
  }

  const res = await fetch(
    `${META_GRAPH_API}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `Meta returned ${res.status}: ${body.slice(0, 300)}` }
  }
  return { ok: true }
}

