import { describe, expect, it } from "vitest"
import { columnSamples, suggestMapping } from "./mapping"

describe("columnSamples", () => {
  it("skips leading empty cells to surface real examples", () => {
    const rows = [
      { email: "", name: "Ada" },
      { email: "  ", name: "Bob" },
      { email: "ada@example.com", name: "Carol" },
      { email: "bob@example.com", name: "Dan" },
    ]
    const samples = columnSamples(rows, ["email", "name"])
    expect(samples.email).toEqual(["ada@example.com", "bob@example.com"])
    expect(samples.name).toEqual(["Ada", "Bob"])
  })

  it("keeps at most 2 samples per column", () => {
    const rows = [{ x: "1" }, { x: "2" }, { x: "3" }]
    expect(columnSamples(rows, ["x"]).x).toEqual(["1", "2"])
  })

  it("returns an empty list for a column that is entirely blank", () => {
    const rows = [{ x: "" }, { x: "" }]
    expect(columnSamples(rows, ["x"]).x).toEqual([])
  })
})

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
