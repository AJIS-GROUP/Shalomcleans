export type CsvContact = {
  name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  tags?: Array<string>
}

const COLUMNS = ["name", "email", "phone", "company", "title", "tags"] as const

/** RFC-4180 escape: wrap in quotes when the value has a comma, quote, or newline. */
function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Build a CSV string from contacts. Tags are joined with ";" within their cell. */
export function contactsToCsv(contacts: Array<CsvContact>): string {
  const header = COLUMNS.join(",")
  const rows = contacts.map((c) => {
    const cells = [
      c.name ?? "",
      c.email ?? "",
      c.phone ?? "",
      c.company ?? "",
      c.title ?? "",
      (c.tags ?? []).join(";"),
    ]
    return cells.map(escapeCell).join(",")
  })
  return [header, ...rows].join("\n")
}
