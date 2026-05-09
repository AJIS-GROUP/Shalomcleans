import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { api } from "../../convex/_generated/api"
import { convex } from "./convex"
import { startOutboundCall } from "./vapi"

export const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  phone: z.string().transform((value, ctx) => {
    const parsed = parsePhoneNumberFromString(value, "US")
    if (!parsed?.isValid()) {
      ctx.addIssue({ code: "custom", message: "Please enter a valid phone number" })
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
    const leadId = await convex.mutation(api.leads.create, data)

    try {
      const result = await startOutboundCall({
        phoneNumber: data.phone,
        assistantOverrides: {
          variableValues: {
            name: data.name,
            service: data.service,
            zip: data.zip,
          },
          metadata: { leadId },
        },
      })

      if (result.skipped) {
        await convex.mutation(api.leads.updateStatus, {
          id: leadId,
          status: "pending",
          notes: `Vapi call skipped: ${result.reason}`,
        })
      } else {
        await convex.mutation(api.leads.updateStatus, {
          id: leadId,
          status: "calling",
          vapiCallId: result.call.id,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await convex.mutation(api.leads.updateStatus, {
        id: leadId,
        status: "failed",
        notes: message,
      })
    }

    return { success: true, leadId }
  })
