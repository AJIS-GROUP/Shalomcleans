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
const SAMPLE_SCAN_ROWS = 500
const SAMPLES_PER_COLUMN = 2

/**
 * Collect a few real (non-empty) example values per column, scanning past
 * leading blank cells so a column like `email` whose first rows are empty still
 * shows representative data in the mapping preview. Bounded on both rows scanned
 * and samples kept.
 */
export function columnSamples(
  rows: Array<Record<string, unknown>>,
  headers: Array<string>,
): Record<string, Array<string>> {
  const out: Record<string, Array<string>> = {}
  for (const h of headers) out[h] = []
  const limit = Math.min(rows.length, SAMPLE_SCAN_ROWS)
  for (let i = 0; i < limit; i++) {
    for (const h of headers) {
      if (out[h].length >= SAMPLES_PER_COLUMN) continue
      const raw = rows[i][h]
      const value = (raw == null ? "" : String(raw)).trim()
      if (value) out[h].push(value)
    }
  }
  return out
}

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
