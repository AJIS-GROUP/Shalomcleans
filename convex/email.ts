import { v } from "convex/values"
import { internalAction, internalMutation, internalQuery } from "./_generated/server"
import { internal } from "./_generated/api"
import { logEvent } from "./events"

const RESEND_API = "https://api.resend.com/emails"
const DEFAULT_FROM = "Shalom Cleans <bookings@shalomcleans.com>"
const DEFAULT_REPLY_TO = "hello@shalomcleans.com"

type LeadEmailContext = {
  leadId: string
  firstName: string
  email: string
  service: string
  zip: string
  notes: string | undefined
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildBookingLink(token: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/r/book/${encodeURIComponent(token)}`
}

export function renderBookingEmailHtml(
  c: LeadEmailContext,
  link: string,
  siteUrl: string,
): string {
  const firstName = escapeHtml(c.firstName || "there")
  const service = escapeHtml(c.service)
  const notes = c.notes ? escapeHtml(c.notes) : ""
  const safeSite = siteUrl.replace(/\/$/, "")
  const logoUrl = `${safeSite}/shalomcleans.webp`
  const preheader =
    "Pick your time and your Shalom Cleans booking is done."

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Complete your Shalom Cleans booking</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .bg-page { background:#0a0a0b !important; }
        .bg-card { background:#141417 !important; }
        .border-soft { border-color:#262629 !important; }
        .text-primary { color:#ffffff !important; }
        .text-muted { color:rgba(255,255,255,0.55) !important; }
        .text-faint { color:rgba(255,255,255,0.35) !important; }
        .summary-card { background:#1a1a1d !important; border-color:#26262a !important; }
        .cta-button { background:#ffffff !important; color:#0a0a0b !important; }
        .footer-link { color:rgba(255,255,255,0.55) !important; }
      }
      @media only screen and (max-width: 600px) {
        .container { width:100% !important; padding:24px 20px !important; }
        .h1 { font-size:28px !important; line-height:1.15 !important; }
        .cta-button { width:100% !important; box-sizing:border-box; }
      }
    </style>
  </head>
  <body class="bg-page" style="margin:0;padding:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background:#f6f5f1;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container bg-card" style="width:600px;max-width:600px;background:#ffffff;border-radius:24px;border:1px solid #ececec;overflow:hidden;" class="border-soft">
            <tr>
              <td style="padding:36px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left">
                      <img src="${logoUrl}" width="44" height="44" alt="Shalom Cleans" style="display:block;border:0;outline:none;text-decoration:none;width:44px;height:44px;" />
                    </td>
                    <td align="right" class="text-faint" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:rgba(0,0,0,0.35);">
                      One step left
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <h1 class="h1 text-primary" style="margin:0;font-size:34px;line-height:1.1;letter-spacing:-0.02em;color:#0a0a0b;font-weight:600;">
                  Complete your booking,<br/>
                  <span style="font-style:italic;color:rgba(0,0,0,0.45);">${firstName}.</span>
                </h1>
              </td>
            </tr>

            <tr>
              <td class="text-muted" style="padding:16px 40px 8px 40px;font-size:16px;line-height:1.55;color:rgba(0,0,0,0.6);">
                Thanks for the call. Tap the button below to pick a date and time. It takes about 30 seconds, and your booking isn't confirmed until you do.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 40px 8px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="border-radius:9999px;background:#0a0a0b;" class="cta-button">
                      <a href="${link}" class="cta-button" style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:600;letter-spacing:-0.01em;color:#ffffff;text-decoration:none;border-radius:9999px;background:#0a0a0b;">
                        Complete My Booking &nbsp;→
                      </a>
                    </td>
                  </tr>
                </table>
                <div class="text-faint" style="margin-top:14px;font-size:11px;color:rgba(0,0,0,0.4);">
                  This link is unique to you. Don't share it.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="summary-card" style="background:#faf9f5;border:1px solid #ececec;border-radius:18px;">
                  <tr>
                    <td style="padding:22px 24px 6px 24px;">
                      <div class="text-faint" style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:rgba(0,0,0,0.4);">
                        Your request
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 24px 6px 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td class="text-faint" style="font-size:12px;color:rgba(0,0,0,0.45);padding:6px 0;width:90px;">Service</td>
                          <td class="text-primary" style="font-size:14px;color:#0a0a0b;padding:6px 0;font-weight:500;">${service}</td>
                        </tr>
                        ${notes ? `<tr>
                          <td class="text-faint" style="font-size:12px;color:rgba(0,0,0,0.45);padding:6px 0;width:90px;vertical-align:top;">Notes</td>
                          <td class="text-primary" style="font-size:14px;color:#0a0a0b;padding:6px 0;font-weight:500;">${notes}</td>
                        </tr>` : ""}
                      </table>
                    </td>
                  </tr>
                  <tr><td style="padding:8px 24px 22px 24px;"></td></tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 40px 8px 40px;">
                <div class="text-faint" style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;color:rgba(0,0,0,0.4);margin-bottom:14px;">
                  What happens next
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:6px 0;" class="text-muted">
                      <span class="text-primary" style="color:#0a0a0b;font-weight:600;">1.</span>
                      <span style="color:rgba(0,0,0,0.6);"> &nbsp;Tap the button above and pick a time on our scheduler.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;" class="text-muted">
                      <span class="text-primary" style="color:#0a0a0b;font-weight:600;">2.</span>
                      <span style="color:rgba(0,0,0,0.6);"> &nbsp;You'll receive an instant confirmation with your slot.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;" class="text-muted">
                      <span class="text-primary" style="color:#0a0a0b;font-weight:600;">3.</span>
                      <span style="color:rgba(0,0,0,0.6);"> &nbsp;Our cleaning team shows up on the day, fully insured.</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:36px 40px 28px 40px;">
                <div style="height:1px;background:#ececec;" class="border-soft"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 40px 36px 40px;" align="center">
                <div class="text-faint" style="font-size:12px;color:rgba(0,0,0,0.45);line-height:1.55;">
                  Need a hand? Just reply to this email. We read every one.
                </div>
                <div style="margin-top:18px;">
                  <a href="${safeSite}" class="footer-link" style="font-size:12px;color:rgba(0,0,0,0.5);text-decoration:none;margin:0 8px;">shalomcleans.com</a>
                  <span class="text-faint" style="color:rgba(0,0,0,0.25);">·</span>
                  <span class="footer-link" style="font-size:12px;color:rgba(0,0,0,0.5);margin:0 8px;">Atlanta Metro · 40-mile radius</span>
                </div>
                <div class="text-faint" style="margin-top:16px;font-size:11px;color:rgba(0,0,0,0.35);">
                  © Shalom Cleans. Licensed & insured.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderBookingEmailText(c: LeadEmailContext, link: string): string {
  const lines = [
    `Hi ${c.firstName || "there"},`,
    "",
    "Thanks for the call. You're one step from a confirmed booking. Tap the link below to pick your date and time. It takes about 30 seconds.",
    "",
    `Complete your booking: ${link}`,
    "",
    "Your request:",
    `- Service: ${c.service}`,
  ]
  if (c.notes) lines.push(`- Notes: ${c.notes}`)
  lines.push(
    "",
    "What happens next:",
    "1. Tap the link and pick a time on our scheduler.",
    "2. We'll email you a confirmation.",
    "3. Our cleaning team shows up on the day, fully insured.",
    "",
    "Need a hand? Just reply to this email.",
    "",
    "Shalom Cleans",
    "shalomcleans.com · Atlanta Metro",
  )
  return lines.join("\n")
}

// ---------------------- Internal helpers ----------------------

export const getLeadForEmail = internalQuery({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    return await ctx.db.get(leadId)
  },
})

export const patchEmailSent = internalMutation({
  args: {
    leadId: v.id("leads"),
    clickToken: v.string(),
    emailSentAt: v.number(),
    emailMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, {
      clickToken: args.clickToken,
      emailSentAt: args.emailSentAt,
      emailMessageId: args.emailMessageId,
      status: "email_sent",
    })
  },
})

function randomToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// ---------------------- Send action ----------------------

export const sendBookingEmail = internalAction({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }): Promise<{ ok: boolean; error?: string; messageId?: string }> => {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      await ctx.runMutation(internal.events.record, {
        kind: "resend_misconfigured",
        severity: "error",
        message: "RESEND_API_KEY not set — booking email skipped",
        leadId,
      })
      return { ok: false, error: "RESEND_API_KEY not set" }
    }

    const lead = await ctx.runQuery(internal.email.getLeadForEmail, { leadId })
    if (!lead) return { ok: false, error: "Lead not found" }

    const firstName = lead.name.trim().split(/\s+/)[0] ?? ""
    const siteUrl = process.env.SITE_URL ?? "https://shalomcleans.com"
    // The redirect endpoint is hosted on Convex's HTTP runtime. Prefer an
    // explicit BOOKING_LINK_BASE_URL (e.g. https://shalomcleans.com once a
    // Vercel rewrite masks the Convex URL); fall back to Convex's site URL.
    const linkBase =
      process.env.BOOKING_LINK_BASE_URL ?? process.env.CONVEX_SITE_URL ?? siteUrl
    const from = process.env.RESEND_FROM ?? DEFAULT_FROM
    const replyTo = process.env.RESEND_REPLY_TO ?? DEFAULT_REPLY_TO

    // Reuse existing token if the email is being resent.
    const token = lead.clickToken ?? randomToken()
    const link = buildBookingLink(token, linkBase)

    const ctxLead: LeadEmailContext = {
      leadId,
      firstName,
      email: lead.email,
      service: lead.service,
      zip: lead.zip,
      notes: lead.notes,
    }

    const html = renderBookingEmailHtml(ctxLead, link, siteUrl)
    const text = renderBookingEmailText(ctxLead, link)

    try {
      const res = await fetch(RESEND_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [lead.email],
          reply_to: replyTo,
          subject: `Complete your Shalom Cleans booking, ${firstName || "there"}`,
          html,
          text,
          tags: [
            { name: "category", value: "booking_link" },
            { name: "lead_id", value: leadId.slice(0, 32) },
          ],
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        const error = `Resend returned ${res.status}: ${body.slice(0, 300)}`
        await ctx.runMutation(internal.events.record, {
          kind: "booking_email_failed",
          severity: "error",
          message: error,
          leadId,
        })
        return { ok: false, error }
      }
      const json = (await res.json()) as { id?: string }
      await ctx.runMutation(internal.email.patchEmailSent, {
        leadId,
        clickToken: token,
        emailSentAt: Date.now(),
        emailMessageId: json.id,
      })
      await ctx.runMutation(internal.events.record, {
        kind: "booking_email_sent",
        severity: "success",
        message: `Booking link emailed to ${lead.email}`,
        leadId,
        data: { messageId: json.id },
      })
      return { ok: true, messageId: json.id }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      await ctx.runMutation(internal.events.record, {
        kind: "booking_email_failed",
        severity: "error",
        message: `Booking email threw: ${error.slice(0, 300)}`,
        leadId,
      })
      return { ok: false, error }
    }
  },
})

// ---------------------- Click tracking ----------------------

export const getLeadByToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_click_token", (q) => q.eq("clickToken", token))
      .first()
  },
})

export const markLinkClicked = internalMutation({
  args: {
    leadId: v.id("leads"),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, ip, userAgent }) => {
    const lead = await ctx.db.get(leadId)
    if (!lead) return
    const patch: Record<string, unknown> = {
      clickedAt: lead.clickedAt ?? Date.now(),
      clickIp: ip?.slice(0, 64),
      clickUserAgent: userAgent?.slice(0, 300),
    }
    // Only advance the status if we haven't reached a stronger one.
    if (lead.status === "email_sent" || lead.status === "confirmed") {
      patch.status = "link_clicked"
    }
    await ctx.db.patch(leadId, patch)
    if (!lead.clickedAt) {
      await logEvent(ctx, {
        kind: "booking_link_clicked",
        severity: "success",
        message: `Booking link clicked by ${lead.name}`,
        leadId,
        data: { ip: ip?.slice(0, 64), userAgent: userAgent?.slice(0, 300) },
      })
    }
  },
})
