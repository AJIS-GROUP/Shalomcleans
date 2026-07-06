import { describe, expect, it } from "vitest"

// actions.ts imports the Convex browser client, which throws unless a URL is
// present. Set a dummy one, then import the module lazily so the schema can be
// exercised in isolation.
process.env.VITE_CONVEX_URL ||= "https://example.convex.cloud"

const validSubmission = {
  name: "John Smith",
  email: "john@example.com",
  phone: "(404) 555-1234",
  zip: "30308",
  service: "Standard",
}

describe("bookingSchema", () => {
  it("accepts a submission without a street address", async () => {
    const { bookingSchema } = await import("./actions")
    const result = bookingSchema.safeParse(validSubmission)
    expect(result.success).toBe(true)
  })

  it("does not carry an address field through to the parsed data", async () => {
    const { bookingSchema } = await import("./actions")
    const result = bookingSchema.safeParse({ ...validSubmission, address: "123 Peachtree St" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty("address")
    }
  })
})
