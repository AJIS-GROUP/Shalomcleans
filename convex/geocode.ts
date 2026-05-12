// OpenStreetMap Nominatim verifier. Free, no API key.
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "shalomcleans-booking/1.0 (contact: hello@shalomcleans.com)"

export type VerifyResult =
  | {
      ok: true
      verified: true
      address: string
      city?: string
      state?: string
      zip: string
      country: string
      lat: string
      lon: string
    }
  | { ok: true; verified: false; reason: string }
  | { ok: false; error: string }

export async function verifyUsAddress(
  street: string,
  zip: string,
): Promise<VerifyResult> {
  if (!street || !zip) {
    return { ok: true, verified: false, reason: "Missing address or zip" }
  }
  const query = `${street}, ${zip}, USA`
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&countrycodes=us&addressdetails=1&limit=1`
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Accept-Language": "en",
      },
    })
    if (!res.ok) {
      return { ok: false, error: `Geocoder returned ${res.status}` }
    }
    const list = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
      address?: {
        house_number?: string
        road?: string
        city?: string
        town?: string
        village?: string
        county?: string
        state?: string
        postcode?: string
        country_code?: string
      }
    }>
    if (!Array.isArray(list) || list.length === 0) {
      return {
        ok: true,
        verified: false,
        reason: "We couldn't find that address — please double-check it.",
      }
    }
    const top = list[0]
    const a = top.address ?? {}
    if ((a.country_code ?? "").toLowerCase() !== "us") {
      return {
        ok: true,
        verified: false,
        reason: "Only US addresses are accepted at this time.",
      }
    }
    const returnedZip = (a.postcode ?? "").split("-")[0]
    if (returnedZip && returnedZip !== zip) {
      return {
        ok: true,
        verified: false,
        reason: `Address looks like it's in ${returnedZip} — does that match the ZIP you entered (${zip})?`,
      }
    }
    return {
      ok: true,
      verified: true,
      address:
        [a.house_number, a.road].filter(Boolean).join(" ") || top.display_name,
      city: a.city ?? a.town ?? a.village ?? a.county,
      state: a.state,
      zip: returnedZip || zip,
      country: "US",
      lat: top.lat,
      lon: top.lon,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
