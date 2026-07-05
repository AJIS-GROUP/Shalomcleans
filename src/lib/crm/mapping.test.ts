import { describe, expect, it } from "vitest"
import { suggestMapping } from "./mapping"

describe("suggestMapping", () => {
  it("detects the common core headers", () => {
    expect(
      suggestMapping([
        "First Name",
        "Email Address",
        "Mobile Phone",
        "Company",
        "Job Title",
        "LinkedIn URL",
      ]),
    ).toEqual([
      { header: "First Name", target: "name" },
      { header: "Email Address", target: "email" },
      { header: "Mobile Phone", target: "phone" },
      { header: "Company", target: "company" },
      { header: "Job Title", target: "title" },
      { header: "LinkedIn URL", target: "custom" },
    ])
  })

  it("keeps the first match for a core field and demotes later ones to custom", () => {
    expect(
      suggestMapping(["Work Email", "Personal Email"]),
    ).toEqual([
      { header: "Work Email", target: "email" },
      { header: "Personal Email", target: "custom" },
    ])
  })

  it("falls back to custom for unrecognized headers", () => {
    expect(suggestMapping(["Employees", "Region"])).toEqual([
      { header: "Employees", target: "custom" },
      { header: "Region", target: "custom" },
    ])
  })
})
