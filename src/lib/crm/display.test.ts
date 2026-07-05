import { describe, expect, it } from "vitest"
import { contactDisplayName } from "./display"

describe("contactDisplayName", () => {
  it("prefers name, then company, then email, then phone", () => {
    expect(contactDisplayName({ name: "Ada", company: "Acme" })).toBe("Ada")
    expect(contactDisplayName({ company: "Acme Spa" })).toBe("Acme Spa")
    expect(contactDisplayName({ email: "a@x.com" })).toBe("a@x.com")
    expect(contactDisplayName({ phone: "(850) 878-7419" })).toBe(
      "(850) 878-7419",
    )
  })

  it("ignores blank/whitespace fields", () => {
    expect(contactDisplayName({ name: "  ", company: "Acme" })).toBe("Acme")
  })

  it("falls back to a placeholder when nothing is present", () => {
    expect(contactDisplayName({})).toBe("Unknown contact")
  })
})
