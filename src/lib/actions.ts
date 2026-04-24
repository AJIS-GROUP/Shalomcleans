import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

export const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  zip: z.string().min(5, "Please enter a valid zip code"),
  service: z.string().min(1, "Please select a service"),
})

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator(bookingSchema)
  .handler(async ({ data }) => {
    console.log("Booking received:", data)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return { success: true, message: "Booking request received! We'll call you in 30 seconds." }
  })
