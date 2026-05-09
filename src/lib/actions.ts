import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { api } from "../../convex/_generated/api"
import { convex } from "./convex"

export const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  zip: z.string().min(5, "Please enter a valid zip code"),
  service: z.string().min(1, "Please select a service"),
})

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator(bookingSchema)
  .handler(async ({ data }) => {
    const leadId = await convex.mutation(api.leads.create, data)
    return { success: true, leadId }
  })
