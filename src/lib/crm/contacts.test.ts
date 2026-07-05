import { describe, expect, it } from "vitest"
import { contactsToCsv } from "./csv"
import {
  emptySelection,
  isRowSelected,
  selectAllMatching,
  selectionCount,
  toggleRow,
} from "./selection"

describe("contactsToCsv", () => {
  it("emits a header row and the core columns", () => {
    const csv = contactsToCsv([
      { name: "Ada", email: "ada@x.com", phone: "555", company: "Acme", title: "CEO", tags: ["vip"] },
    ])
    const [header, row] = csv.split("\n")
    expect(header).toBe("name,email,phone,company,title,tags")
    expect(row).toBe("Ada,ada@x.com,555,Acme,CEO,vip")
  })

  it("RFC-escapes fields containing commas, quotes, or newlines", () => {
    const csv = contactsToCsv([
      { name: 'Ada, "the" Countess', company: "Line1\nLine2" },
    ])
    const row = csv.split("\n").slice(1).join("\n")
    // comma + embedded quotes → wrapped and quotes doubled
    expect(row).toContain('"Ada, ""the"" Countess"')
    // newline inside a field → whole field quoted, newline preserved
    expect(row).toContain('"Line1\nLine2"')
  })

  it("joins multiple tags with a semicolon", () => {
    const csv = contactsToCsv([{ name: "Bob", tags: ["a", "b", "c"] }])
    expect(csv.split("\n")[1]).toBe("Bob,,,,,a;b;c")
  })
})

describe("selection model", () => {
  it("starts empty and counts zero", () => {
    const s = emptySelection()
    expect(selectionCount(s, 200)).toBe(0)
    expect(isRowSelected(s, "x")).toBe(false)
  })

  it("toggles individual rows", () => {
    let s = emptySelection()
    s = toggleRow(s, "a")
    s = toggleRow(s, "b")
    expect(isRowSelected(s, "a")).toBe(true)
    expect(selectionCount(s, 200)).toBe(2)
    s = toggleRow(s, "a")
    expect(isRowSelected(s, "a")).toBe(false)
    expect(selectionCount(s, 200)).toBe(1)
  })

  it("select-all-matching counts the full filter total, not the loaded page", () => {
    const s = selectAllMatching(4213)
    expect(selectionCount(s, 200)).toBe(4213)
    // every row reads as selected under all-matching
    expect(isRowSelected(s, "anything")).toBe(true)
  })
})
