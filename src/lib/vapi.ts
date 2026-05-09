const VAPI_API = "https://api.vapi.ai"

type StartCallInput = {
  phoneNumber: string
  assistantOverrides?: {
    variableValues?: Record<string, string>
    metadata?: Record<string, unknown>
  }
}

export async function startOutboundCall(input: StartCallInput) {
  const key = process.env.VAPI_PRIVATE_KEY
  const assistantId = process.env.VAPI_ASSISTANT_ID
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID

  if (!key || !assistantId) {
    throw new Error("Missing VAPI_PRIVATE_KEY or VAPI_ASSISTANT_ID")
  }
  if (!phoneNumberId) {
    return { skipped: true as const, reason: "VAPI_PHONE_NUMBER_ID not set" }
  }

  const res = await fetch(`${VAPI_API}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: input.phoneNumber },
      assistantOverrides: input.assistantOverrides,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vapi call failed (${res.status}): ${body}`)
  }

  return { skipped: false as const, call: await res.json() }
}
