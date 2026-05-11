import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { useAction, useQuery } from "convex/react"
import { Phone, RefreshCw, ExternalLink, Clock, DollarSign, X, MessageCircle } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/calls")({
  component: CallsPage,
})

type VapiCall = {
  id: string
  type?: string
  status?: string
  endedReason?: string
  startedAt?: string
  endedAt?: string
  cost?: number
  customer?: { number?: string; name?: string }
  analysis?: { summary?: string; structuredData?: Record<string, unknown> }
  transcript?: string
  recordingUrl?: string
  messages?: Array<{ role: string; message: string; time?: number }>
}

function CallsPage() {
  const listCalls = useAction(api.calls.list)
  const getCall = useAction(api.calls.get)
  const leads = useQuery(api.admin.listLeads, { limit: 200 })

  const [calls, setCalls] = useState<Array<VapiCall> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<VapiCall | null>(null)
  const [selectedLoading, setSelectedLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const result = await listCalls({ limit: 50 })
      if (result.ok) setCalls(result.calls ?? [])
      else setError(result.error ?? "Failed to fetch calls")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const leadsByCallId = useMemo(() => {
    const map = new Map<string, { name: string; service: string; status: string }>()
    leads?.forEach((l) => {
      if (l.vapiCallId) map.set(l.vapiCallId, { name: l.name, service: l.service, status: l.status })
    })
    return map
  }, [leads])

  async function openCall(c: VapiCall) {
    setSelected(c)
    setSelectedLoading(true)
    try {
      const full = await getCall({ id: c.id })
      if (full.ok && full.call) setSelected(full.call)
    } finally {
      setSelectedLoading(false)
    }
  }

  return (
    <>
      <Reveal>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Calls</h1>
          <p className="text-sm text-white/40 mt-1">
            Live data from Vapi cross-referenced with leads in Convex.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[#c4f54a] text-black font-medium px-4 py-2 text-xs hover:bg-[#d2ff5a] disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      </Reveal>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      <Reveal delay={0.12}>
      <div className="rounded-3xl bg-[#101012] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-white/40 text-xs">
              <tr>
                <Th>Customer</Th>
                <Th>Lead</Th>
                <Th>Duration</Th>
                <Th>Ended</Th>
                <Th>Cost</Th>
                <Th>Started</Th>
                <Th>{" "}</Th>
              </tr>
            </thead>
            <tbody>
              {calls === null && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-white/30 text-xs">
                    Loading from Vapi…
                  </td>
                </tr>
              )}
              {calls?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-white/30 text-xs">
                    No calls yet.
                  </td>
                </tr>
              )}
              {calls?.map((c) => {
                const lead = leadsByCallId.get(c.id)
                return (
                  <tr
                    key={c.id}
                    onClick={() => openCall(c)}
                    className="border-t border-white/5 hover:bg-white/[0.02] cursor-pointer"
                  >
                    <Td>
                      <div className="text-white">{c.customer?.number ?? "—"}</div>
                      <div className="text-[10px] text-white/40">{c.customer?.name ?? ""}</div>
                    </Td>
                    <Td>
                      {lead ? (
                        <div>
                          <div className="text-white/80">{lead.name}</div>
                          <div className="text-[10px] text-white/40">{lead.service}</div>
                        </div>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </Td>
                    <Td><span className="text-white/80">{duration(c.startedAt, c.endedAt)}</span></Td>
                    <Td>
                      <EndedPill reason={c.endedReason} status={c.status} />
                    </Td>
                    <Td>
                      <span className="text-white/80">
                        {c.cost != null ? `$${c.cost.toFixed(3)}` : "—"}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-white/50 text-xs">
                        {c.startedAt ? new Date(c.startedAt).toLocaleString() : "—"}
                      </span>
                    </Td>
                    <Td><ExternalLink size={12} className="text-white/30" /></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      </Reveal>

      {selected && (
        <CallDrawer
          call={selected}
          lead={leadsByCallId.get(selected.id)}
          loading={selectedLoading}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function CallDrawer({
  call,
  lead,
  loading,
  onClose,
}: {
  call: VapiCall
  lead?: { name: string; service: string; status: string }
  loading: boolean
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-xl bg-[#1a1a1c] border-l border-white/5 p-7 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-white/40">Vapi call</div>
            <div className="font-mono text-xs text-white/60 mt-1 break-all">{call.id}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatTile icon={<Clock size={14} />} label="Duration" value={duration(call.startedAt, call.endedAt)} />
          <StatTile icon={<DollarSign size={14} />} label="Cost" value={call.cost != null ? `$${call.cost.toFixed(3)}` : "—"} />
          <StatTile icon={<Phone size={14} />} label="To" value={call.customer?.number ?? "—"} />
          <StatTile icon={<MessageCircle size={14} />} label="Ended" value={call.endedReason ?? call.status ?? "—"} />
        </div>

        {lead && (
          <div className="mb-6 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
              Linked lead
            </div>
            <div className="text-sm text-white">{lead.name}</div>
            <div className="text-xs text-white/50">{lead.service} · {lead.status}</div>
          </div>
        )}

        {call.analysis?.summary && (
          <Section title="Summary">
            <p className="text-sm text-white/80">{call.analysis.summary}</p>
          </Section>
        )}

        {call.recordingUrl && (
          <Section title="Recording">
            <audio controls src={call.recordingUrl} className="w-full" />
          </Section>
        )}

        {call.transcript ? (
          <Section title="Transcript">
            <pre className="text-xs text-white/70 whitespace-pre-wrap bg-[#101012] border border-white/5 rounded-2xl p-4">
              {call.transcript}
            </pre>
          </Section>
        ) : call.messages?.length ? (
          <Section title="Transcript">
            <div className="space-y-2">
              {call.messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-xs ${
                    m.role === "user"
                      ? "bg-white/5 text-white/80"
                      : m.role === "bot" || m.role === "assistant"
                      ? "bg-[#c4f54a]/10 text-[#c4f54a]"
                      : "bg-white/[0.02] text-white/40"
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wide opacity-60 mb-1">{m.role}</div>
                  {m.message}
                </div>
              ))}
            </div>
          </Section>
        ) : loading ? (
          <div className="text-xs text-white/30">Loading transcript…</div>
        ) : null}
      </aside>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-[#101012] border border-white/5 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/40">
        {icon} {label}
      </div>
      <div className="text-sm text-white mt-1.5 break-words">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">{title}</div>
      {children}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-normal">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>
}

function EndedPill({ reason, status }: { reason?: string; status?: string }) {
  const r = (reason ?? status ?? "").toLowerCase()
  const tone = r.includes("error") || r.includes("failed")
    ? "bg-red-500/15 text-red-400 border-red-500/20"
    : r.includes("no-answer") || r.includes("voicemail")
    ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
    : r.includes("customer-ended") || r.includes("assistant-ended")
    ? "bg-[#c4f54a]/20 text-[#c4f54a] border-[#c4f54a]/30"
    : "bg-white/10 text-white/60 border-white/10"
  return (
    <span className={`text-[10px] rounded-full px-2 py-0.5 border ${tone}`}>
      {reason || status || "—"}
    </span>
  )
}

function duration(start?: string, end?: string) {
  if (!start || !end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return "—"
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}
