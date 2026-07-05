/**
 * A human label for a contact. Imported lists are often businesses with a
 * company but no person name, so fall back through company → email → phone
 * rather than showing a bare dash.
 */
export function contactDisplayName(contact: {
  name?: string
  company?: string
  email?: string
  phone?: string
}): string {
  const candidates = [
    contact.name,
    contact.company,
    contact.email,
    contact.phone,
  ]
  for (const c of candidates) {
    if (c && c.trim()) return c.trim()
  }
  return "Unknown contact"
}
