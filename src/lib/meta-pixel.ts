type FbqEventName =
  | "PageView"
  | "Lead"
  | "InitiateCheckout"
  | "Schedule"
  | "Purchase"
  | "ViewContent"
  | "CompleteRegistration"
  | "Contact"

type FbqEventParams = {
  event_id?: string
  value?: number
  currency?: string
  content_name?: string
  content_category?: string
  [key: string]: unknown
}

declare global {
  interface Window {
    fbq?: (
      command: "track" | "trackCustom" | "init" | "consent",
      eventNameOrId: string,
      params?: FbqEventParams,
      options?: { eventID?: string },
    ) => void
  }
}

export const trackPixel = (
  event: FbqEventName,
  params: FbqEventParams = {},
) => {
  if (typeof window === "undefined" || !window.fbq) return
  const { event_id, ...rest } = params
  window.fbq("track", event, rest, event_id ? { eventID: event_id } : undefined)
}

export const newEventId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
