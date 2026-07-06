import { describe, expect, it } from "vitest"
import { renderBookingEmailHtml, renderBookingEmailText } from "./email"

const ctx = {
  leadId: "lead_123",
  firstName: "John",
  email: "john@example.com",
  service: "Deep Clean",
  zip: "30308",
  notes: undefined,
}

const link = "https://shalomcleans.com/r/book/tok123"
const site = "https://shalomcleans.com"

describe("booking email", () => {
  it("does not render an Address row in the HTML", () => {
    const html = renderBookingEmailHtml(ctx, link, site)
    expect(html).not.toContain("Address")
    expect(html).toContain("Deep Clean")
    expect(html).toContain(link)
  })

  it("does not render an Address line in the plain text", () => {
    const text = renderBookingEmailText(ctx, link)
    expect(text).not.toContain("Address")
    expect(text).toContain("Deep Clean")
    expect(text).toContain(link)
  })
})
