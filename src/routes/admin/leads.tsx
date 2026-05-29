import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useAction, useQuery } from "convex/react"
import { Search, Users, Mail, Phone, MapPin, X, Send, CheckCircle2 } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/leads")({
  component: LeadsPage,
})

type Status =
  | "all"
  | "pending"
  | "calling"
  | "confirmed"
  | "email_sent"
  | "link_clicked"
  | "booked"
  | "declined"
  | "no_answer"
  | "failed"

const FILTERS: Array<{ key: Status; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "calling", label: "Calling" },
  { key: "confirmed", label: "Confirmed" },
  { key: "email_sent", label: "Email sent" },
  { key: "link_clicked", label: "Link clicked" },
  { key: "booked", label: "Booked" },
  { key: "no_answer", label: "No answer" },
  { key: "declined", label: "Declined" },
  { key: "failed", label: "Failed" },
]

function LeadsPage() {
  const [status, setStatus] = useState<Status>("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const leads = useQuery(api.admin.listLeads, {
    status,
    search: search || undefined,
    limit: 200,
  })

  const selected = useMemo(
    () => leads?.find((l) => l._id === selectedId),
    [leads, selectedId],
  )

  return (
    <>
      <Reveal>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Leads</h1>
          <p className="text-sm text-white/40 mt-1">
            Every booking inquiry, pulled in real time from Convex.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, phone…"
              className="w-64 bg-[#101012] border border-white/5 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#c4f54a]/40 focus:ring-2 focus:ring-[#c4f54a]/10"
            />
          </div>
        </div>
      </div>
      </Reveal>

      <Reveal delay={0.08}>
      <div className="flex flex-wrap gap-1 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`rounded-full px-4 py-2 text-xs transition-colors ${
              status === f.key
                ? "bg-[#c4f54a] text-black font-medium"
                : "text-white/60 hover:bg-white/5 border border-white/5"
            }`}
          >
            {f.label}
            {leads && f.key !== "all" && (
              <span className="ml-2 opacity-50">
                {leads.filter((l) => l.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>
      </Reveal>

      <Reveal delay={0.16}>
      <div className="rounded-3xl bg-[#101012] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-white/40 text-xs">
              <tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Service</Th>
                <Th>ZIP</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {leads === undefined && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-white/30 text-xs">
                    Loading…
                  </td>
                </tr>
              )}
              {leads?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-white/30 text-xs">
                    No leads match this filter.
                  </td>
                </tr>
              )}
              {leads?.map((l) => (
                <tr
                  key={l._id}
                  onClick={() => setSelectedId(l._id)}
                  className="border-t border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-[#c4f54a]/30 flex items-center justify-center text-[10px] font-medium">
                        {initials(l.name)}
                      </div>
                      <div>
                        <div className="text-white">{l.name}</div>
                        <div className="text-[10px] text-white/40">{l.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-white/80">{l.phone}</div>
                  </Td>
                  <Td><span className="text-white/80">{l.service}</span></Td>
                  <Td><span className="text-white/80">{l.zip}</span></Td>
                  <Td><StatusPill status={l.status} /></Td>
                  <Td>
                    <span className="text-white/50 text-xs">
                      {new Date(l._creationTime).toLocaleString()}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </Reveal>

      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}

function LeadDrawer({
  lead,
  onClose,
}: {
  lead: Doc<"leads">
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md bg-[#1a1a1c] border-l border-white/5 p-7 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/40 to-[#c4f54a]/30 flex items-center justify-center text-sm font-medium">
              {initials(lead.name)}
            </div>
            <div>
              <div className="font-display text-lg">{lead.name}</div>
              <StatusPill status={lead.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        <DetailRow icon={<Mail size={14} />} label="Email" value={lead.email} />
        <DetailRow icon={<Phone size={14} />} label="Phone" value={lead.phone} />
        <DetailRow icon={<Users size={14} />} label="Service" value={lead.service} />
        <DetailRow
          icon={<MapPin size={14} />}
          label="Address"
          value={formatAddress(lead) ?? "—"}
        />
        <DetailRow icon={<MapPin size={14} />} label="ZIP" value={lead.zip} />

        {lead.vapiCallId && (
          <DetailRow label="Vapi call ID" value={lead.vapiCallId} mono />
        )}
        {lead.bookingKoalaId && (
          <DetailRow
            label="BookingKoala ID"
            value={lead.bookingKoalaId}
            mono
          />
        )}
        {lead.emailSentAt && (
          <DetailRow
            label="Email sent"
            value={new Date(lead.emailSentAt).toLocaleString()}
          />
        )}
        {lead.clickedAt && (
          <DetailRow
            label="Link clicked"
            value={new Date(lead.clickedAt).toLocaleString()}
          />
        )}
        {lead.pendingAttempts ? (
          <DetailRow
            label="Pending retries"
            value={`${lead.pendingAttempts} attempt${lead.pendingAttempts === 1 ? "" : "s"}`}
          />
        ) : null}
        {lead.notes && (
          <div className="mt-5">
            <div className="text-xs text-white/40 mb-2">Notes</div>
            <div className="text-sm text-white/80 bg-[#101012] border border-white/5 rounded-2xl p-4 whitespace-pre-wrap">
              {lead.notes}
            </div>
          </div>
        )}

        <ResendBookingEmail leadId={lead._id} alreadySent={!!lead.emailSentAt} />

        <div className="mt-7 text-xs text-white/40">
          Submitted {new Date(lead._creationTime).toLocaleString()}
        </div>
      </aside>
    </div>
  )
}

function ResendBookingEmail({
  leadId,
  alreadySent,
}: {
  leadId: Id<"leads">
  alreadySent: boolean
}) {
  const send = useAction(api.admin.resendBookingEmail)
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "ok" }
    | { kind: "err"; message: string }
  >({ kind: "idle" })

  const onClick = async () => {
    setState({ kind: "sending" })
    try {
      const r = await send({ leadId })
      if (r.ok) setState({ kind: "ok" })
      else setState({ kind: "err", message: r.error ?? "Failed" })
    } catch (err) {
      setState({
        kind: "err",
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-[#101012] border border-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/70 font-medium">
            {alreadySent ? "Resend booking email" : "Send booking email"}
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            Re-renders the template and re-uses the existing click token.
          </div>
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={state.kind === "sending"}
          className="inline-flex items-center gap-2 rounded-full bg-[#c4f54a] text-black text-xs font-semibold px-4 py-2 hover:bg-[#d4ff5a] active:scale-95 transition disabled:opacity-50"
        >
          {state.kind === "ok" ? (
            <>
              <CheckCircle2 size={14} /> Sent
            </>
          ) : (
            <>
              <Send size={14} />
              {state.kind === "sending" ? "Sending…" : alreadySent ? "Resend" : "Send"}
            </>
          )}
        </button>
      </div>
      {state.kind === "err" && (
        <div className="mt-3 text-[11px] text-red-400">{state.message}</div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-normal">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      {icon && <div className="text-white/30 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
        <div className={`text-sm text-white break-all ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-white/10 text-white/70",
    calling: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    confirmed: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
    email_sent: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
    link_clicked: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    booked: "bg-[#c4f54a]/20 text-[#c4f54a] border border-[#c4f54a]/30",
    declined: "bg-red-500/15 text-red-400 border border-red-500/20",
    no_answer: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    failed: "bg-red-500/15 text-red-400 border border-red-500/20",
  }
  const label = status.replace("_", " ")
  return (
    <span className={`inline-block text-[10px] rounded-full px-2 py-0.5 ${map[status] ?? "bg-white/10 text-white/60"}`}>
      {label}
    </span>
  )
}

function formatAddress(lead: Doc<"leads">) {
  const cityState = [lead.city, lead.state].filter(Boolean).join(", ")
  const parts = [lead.address, cityState].filter(Boolean)
  return parts.length ? parts.join(" · ") : null
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}
