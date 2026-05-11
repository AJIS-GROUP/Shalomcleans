import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "convex/react"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertOctagon,
  ScrollText,
} from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/logs")({
  component: LogsPage,
})

type Severity = "all" | "info" | "warn" | "error" | "success"

const SEVERITIES: Array<{ key: Severity; label: string }> = [
  { key: "all", label: "All" },
  { key: "info", label: "Info" },
  { key: "success", label: "Success" },
  { key: "warn", label: "Warnings" },
  { key: "error", label: "Errors" },
]

function LogsPage() {
  const [severity, setSeverity] = useState<Severity>("all")

  const events = useQuery(api.events.list, {
    limit: 100,
    severity: severity === "all" ? undefined : severity,
  })
  const pending = useQuery(api.admin.pendingBookings)

  return (
    <>
      <Reveal>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Logs</h1>
          <p className="text-sm text-white/40 mt-1">
            System events from leads, Vapi, Make and the booking pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {SEVERITIES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeverity(s.key)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                severity === s.key
                  ? "bg-[#c4f54a] text-black font-medium"
                  : "text-white/60 hover:bg-white/5 border border-white/5"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      </Reveal>

      {pending && pending.length > 0 && (
        <Reveal delay={0.08}>
        <div className="mb-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 p-5">
          <div className="flex items-center gap-2 text-sm mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-amber-300 font-medium">
              {pending.length} booking{pending.length === 1 ? "" : "s"} pending retry
            </span>
            <span className="text-xs text-white/40">— Make dispatch failed; cron retries every 5 min</span>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white">{p.name}</div>
                  <div className="text-[10px] text-white/40">
                    {p.service} · {p.notes ?? "no detail"}
                  </div>
                </div>
                <div className="text-[10px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1">
                  {p.attempts} {p.attempts === 1 ? "try" : "tries"}
                </div>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      )}

      <Reveal delay={0.16}>
      <div className="rounded-3xl bg-[#101012] border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2 text-sm">
          <ScrollText size={14} className="text-white/40" />
          Event stream
          <span className="ml-auto text-xs text-white/40">
            {events?.length ?? 0} events
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {events === undefined && (
            <div className="py-10 text-center text-xs text-white/30">Loading…</div>
          )}
          {events?.length === 0 && (
            <div className="py-12 text-center text-xs text-white/30">
              No events yet. Submit a booking on the homepage to populate this feed.
            </div>
          )}
          {events?.map((e) => (
            <div key={e._id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/[0.02]">
              <div className="mt-0.5">{severityIcon(e.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white">{e.message}</span>
                  <span className="text-[10px] font-mono text-white/40">
                    {e.kind}
                  </span>
                </div>
                {(e.vapiCallId || e.leadId) && (
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-white/40 font-mono">
                    {e.vapiCallId && <span>vapi:{e.vapiCallId.slice(0, 12)}…</span>}
                    {e.leadId && <span>lead:{e.leadId.slice(0, 8)}…</span>}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-white/40 whitespace-nowrap">
                {new Date(e._creationTime).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      </Reveal>
    </>
  )
}

function severityIcon(severity: string) {
  switch (severity) {
    case "success":
      return <CheckCircle2 size={14} className="text-[#c4f54a]" />
    case "warn":
      return <AlertTriangle size={14} className="text-amber-400" />
    case "error":
      return <AlertOctagon size={14} className="text-red-400" />
    default:
      return <Info size={14} className="text-blue-400" />
  }
}
