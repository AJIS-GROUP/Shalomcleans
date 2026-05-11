import { internalAction } from "./_generated/server"
import { v } from "convex/values"
import { createAuth } from "./auth"

export const seedAdmin = internalAction({
  args: {
    email: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { email = "admin@ogaticket.com", password = "12345" },
  ) => {
    const auth = createAuth(ctx)
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: "Admin",
        },
      })
      return { ok: true, userId: result.user.id }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, error: msg }
    }
  },
})
