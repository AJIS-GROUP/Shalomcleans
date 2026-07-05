export type ColumnTarget =
  | "name"
  | "email"
  | "phone"
  | "company"
  | "title"
  | "custom"
  | "ignore"

export type ColumnMapping = Array<{ header: string; target: ColumnTarget }>

// Ordered so the first (most specific) match wins for a given header.
const PATTERNS: Array<{ target: Exclude<ColumnTarget, "custom" | "ignore">; re: RegExp }> = [
  { target: "email", re: /e-?mail/i },
  { target: "phone", re: /phone|mobile|\btel\b|cell/i },
  { target: "company", re: /company|organi[sz]ation|\borg\b|business|account/i },
  { target: "title", re: /title|\brole\b|position|job\s*title/i },
  { target: "name", re: /name/i },
]

function detect(header: string): Exclude<ColumnTarget, "ignore"> {
  for (const { target, re } of PATTERNS) {
    if (re.test(header)) return target
  }
  return "custom"
}

/**
 * Auto-suggest a column mapping from sheet headers. Each header is fuzzy-matched
 * to a core field; the first header claiming a core field wins and any later
 * header for that same field is demoted to custom — mirroring the server
 * importer, which keeps the first column and routes duplicates to custom.
 */
export function suggestMapping(headers: Array<string>): ColumnMapping {
  const claimed = new Set<ColumnTarget>()
  return headers.map((header) => {
    const guess = detect(header)
    if (guess !== "custom" && !claimed.has(guess)) {
      claimed.add(guess)
      return { header, target: guess }
    }
    return { header, target: "custom" as const }
  })
}
