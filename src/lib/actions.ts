import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { api } from "../../convex/_generated/api"
import { convex } from "./convex"

// Client-side validation (server re-validates inside the Convex action).
export const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  phone: z.string().transform((value, ctx) => {
    const parsed = parsePhoneNumberFromString(value, "US")
    if (!parsed?.isValid()) {
      ctx.addIssue({ code: "custom", message: "Please enter a valid phone number" })
      return z.NEVER
    }
    if (parsed.country !== "US") {
      ctx.addIssue({
        code: "custom",
        message: "Only US phone numbers are accepted at this time.",
      })
      return z.NEVER
    }
    return parsed.number
  }),
  zip: z.string().regex(/^\d{5}$/, "Please enter a valid 5-digit zip code"),
  service: z.string().min(1, "Please select a service"),
})

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator(bookingSchema)
  .handler(async ({ data }) => {
    const result = await convex.action(api.bookings.submit, data)
    if (!result.ok) {
      throw new Error(result.error)
    }
    return { success: true, leadId: result.leadId }
  })
