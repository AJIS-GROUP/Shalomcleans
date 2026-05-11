import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "convex/react"
import {
  Users,
  Phone,
  CalendarCheck,
  ArrowUpRight,
  ChevronDown,
  Filter as FilterIcon,
  Calendar,
  Download,
  MoreHorizontal,
  Plus,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
})

type LeadStatus = "all" | "pending" | "calling" | "booked" | "declined" | "no_answer" | "failed"

function AdminDashboard() {
  const overview = useQuery(api.admin.overview)
  const byMonth = useQuery(api.admin.leadsByMonth, { months: 6 })
  const heatmap = useQuery(api.admin.callHeatmap)
  const recent = useQuery(api.admin.recentLeads, { limit: 8 })
  const bestSvc = useQuery(api.admin.bestService)
  const pending = useQuery(api.admin.pendingBookings)

  const [activeFilter, setActiveFilter] = useState<LeadStatus>("all")

  const filteredRecent = recent?.filter(
    (l) => activeFilter === "all" || l.status === activeFilter,
  )

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <Reveal><WelcomeBanner /></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Reveal delay={0.05}>
            <KpiCard
              icon={<Users size={16} />}
              label="Total leads"
              value={overview?.totalLeads.value ?? 0}
              deltaPct={overview?.totalLeads.deltaPct ?? 0}
              hint="from previous week"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <KpiCard
              icon={<CalendarCheck size={16} />}
              label="Bookings"
              value={overview?.bookings.value ?? 0}
              deltaPct={overview?.bookings.deltaPct ?? 0}
              hint="from previous week"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <KpiCard
              icon={<Sparkles size={16} />}
              label="Conversion"
              value={`${(overview?.conversion.value ?? 0).toFixed(1)}%`}
              deltaPct={overview?.conversion.deltaPct ?? 0}
              hint="vs last week"
              accent
            />
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.2}>
        <div className="mt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <FilterTabs active={activeFilter} onChange={setActiveFilter} />
          <div className="flex items-center gap-2">
            <IconBtn><FilterIcon size={14} /></IconBtn>
            <IconBtn><Calendar size={14} /></IconBtn>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors">
              <Download size={14} /> Download reports
            </button>
          </div>
        </div>
      </Reveal>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4">
        <Reveal delay={0.25}><LeadsBarCard data={byMonth} /></Reveal>
        <Reveal delay={0.3}><HeatmapCard data={heatmap} /></Reveal>
        <Reveal delay={0.35}><RecentActivityCard recent={filteredRecent} /></Reveal>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Reveal delay={0.4}><BestServiceCard data={bestSvc} /></Reveal>
        <Reveal delay={0.45}><PendingDLQCard data={pending} /></Reveal>
      </div>
    </>
  )
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 inline-flex items-center justify-center text-white/70 transition-colors">
      {children}
    </button>
  )
}

function WelcomeBanner() {
  return (
    <div>
      <p className="text-sm text-white/40">Welcome back,</p>
      <div className="mt-1 flex items-center gap-3 flex-wrap">
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">
          Admin<br className="hidden sm:block" />Console
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 text-xs">
          <Sparkles size={12} /> Admin
        </span>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  deltaPct,
  hint,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  deltaPct: number
  hint: string
  accent?: boolean
}) {
  const positive = deltaPct >= 0
  return (
    <div
      className={`relative rounded-3xl p-5 border ${
        accent
          ? "bg-[#c4f54a] text-black border-[#c4f54a]"
          : "bg-[#101012] text-white border-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs opacity-80">
          <div className={`w-7 h-7 rounded-full ${accent ? "bg-black/10" : "bg-white/5"} flex items-center justify-center`}>
            {icon}
          </div>
          {label}
        </div>
        <button className={`w-7 h-7 rounded-full ${accent ? "bg-black/10 hover:bg-black/20" : "bg-white/5 hover:bg-white/10"} inline-flex items-center justify-center`}>
          <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="mt-5 text-3xl font-display">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className={`mt-1 text-xs ${accent ? "text-black/60" : "text-white/50"}`}>
        <span className={positive ? (accent ? "text-black/80" : "text-[#c4f54a]") : "text-red-400"}>
          {positive ? "+" : ""}
          {deltaPct.toFixed(1)}%
        </span>{" "}
        {hint}
      </div>
    </div>
  )
}

const FILTERS: Array<{ key: LeadStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "calling", label: "Calling" },
  { key: "booked", label: "Booked" },
  { key: "failed", label: "Failed" },
]

function FilterTabs({
  active,
  onChange,
}: {
  active: LeadStatus
  onChange: (s: LeadStatus) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`rounded-full px-4 py-2 text-xs transition-colors ${
            active === f.key
              ? "bg-[#c4f54a] text-black font-medium"
              : "text-white/70 hover:bg-white/5"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function LeadsBarCard({
  data,
}: {
  data: Array<{ label: string; count: number }> | undefined
}) {
  const months = data ?? []
  const max = Math.max(1, ...months.map((m) => m.count))
  const peakIdx = months.reduce(
    (best, m, i) => (m.count > (months[best]?.count ?? 0) ? i : best),
    0,
  )

  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <Users size={14} className="text-white/70" />
          </div>
          Leads per month
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button className="rounded-full px-3 py-1.5 text-white/60 hover:bg-white/5">Monthly</button>
          <button className="rounded-full bg-[#c4f54a] text-black font-medium px-3 py-1.5">6mo</button>
          <button className="w-7 h-7 rounded-full hover:bg-white/5 inline-flex items-center justify-center text-white/40">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="mt-6 h-56 flex items-end gap-3 sm:gap-4 px-1">
        {months.map((m, i) => {
          const h = (m.count / max) * 100
          const isPeak = i === peakIdx && m.count > 0
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex-1 flex items-end">
                {isPeak && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-center">
                    <div className="inline-block bg-purple-500 text-white text-[10px] rounded-full px-2 py-0.5 mb-1">
                      Peak
                    </div>
                    <div className="text-[10px] text-white/50">{m.count} leads</div>
                  </div>
                )}
                <div
                  className={`w-full rounded-t-xl ${
                    isPeak
                      ? "bg-purple-500"
                      : "bg-[#1f1f22] [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_6px)] border-2 border-dashed border-white/10"
                  }`}
                  style={{ height: `${Math.max(h, 6)}%` }}
                />
              </div>
              <div className="text-[10px] text-white/40">{m.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeatmapCard({
  data,
}: {
  data:
    | { days: Array<string>; hours: Array<string>; grid: Array<Array<number>> }
    | undefined
}) {
  const days = data?.days ?? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = data?.hours ?? ["8a", "9a", "10a", "11a", "12p", "1p", "2p"]
  const grid = data?.grid ?? Array.from({ length: 7 }, () => Array(7).fill(0))
  const max = Math.max(1, ...grid.flat())

  const cellColor = (n: number) => {
    if (n === 0) return "bg-white/5"
    const ratio = n / max
    if (ratio > 0.75) return "bg-[#c4f54a]"
    if (ratio > 0.5) return "bg-[#c4f54a]/70"
    if (ratio > 0.25) return "bg-[#c4f54a]/40"
    return "bg-[#c4f54a]/20"
  }

  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <Phone size={14} className="text-white/70" />
          </div>
          Calls heatmap
        </div>
        <button className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70">
          By day <ChevronDown size={12} />
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        <div className="flex flex-col justify-between py-1 text-[9px] text-white/40">
          {hours.map((h) => (
            <div key={h}>{h}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 gap-1.5">
          {days.map((_, dayIdx) =>
            hours.map((_, hourIdx) => (
              <div
                key={`${dayIdx}-${hourIdx}`}
                className={`aspect-square rounded ${cellColor(grid[dayIdx]?.[hourIdx] ?? 0)}`}
                title={`${days[dayIdx]} ${hours[hourIdx]}: ${grid[dayIdx]?.[hourIdx] ?? 0}`}
              />
            )),
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-white/40 pl-7">
        {days.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
    </div>
  )
}

function RecentActivityCard({
  recent,
}: {
  recent: Array<{
    _id: string
    _creationTime: number
    name: string
    service: string
    status: string
    phone: string
  }> | undefined
}) {
  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <Users size={14} className="text-white/70" />
          </div>
          Recent leads
        </div>
        <button className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center">
          <Plus size={14} className="text-white/70" />
        </button>
      </div>

      <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
        {recent === undefined && (
          <div className="text-xs text-white/30 py-6 text-center">Loading…</div>
        )}
        {recent?.length === 0 && (
          <div className="text-xs text-white/30 py-6 text-center">No leads yet</div>
        )}
        {recent?.map((l) => (
          <div key={l._id} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/40 to-[#c4f54a]/30 flex items-center justify-center text-xs font-medium">
              {initials(l.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{l.name}</div>
              <div className="text-[10px] text-white/40 truncate">{l.service}</div>
            </div>
            <StatusPill status={l.status} />
            <div className="text-[10px] text-white/40 whitespace-nowrap">
              {relativeTime(l._creationTime)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BestServiceCard({
  data,
}: {
  data:
    | Array<{ service: string; total: number; booked: number }>
    | undefined
}) {
  const top = data?.[0]
  const max = Math.max(1, ...(data?.map((d) => d.total) ?? []))

  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <TrendingUp size={14} className="text-white/70" />
          </div>
          Best service
        </div>
        {top && (
          <span className="text-xs text-[#c4f54a]">
            {top.service} · {top.booked}/{top.total}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {data === undefined && (
          <div className="text-xs text-white/30 py-3">Loading…</div>
        )}
        {data?.length === 0 && (
          <div className="text-xs text-white/30 py-3">No data yet</div>
        )}
        {data?.map((row) => {
          const ratio = (row.total / max) * 100
          const conv = row.total > 0 ? (row.booked / row.total) * 100 : 0
          return (
            <div key={row.service}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/80">{row.service}</span>
                <span className="text-white/40">
                  {row.booked}/{row.total} · {conv.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-[#c4f54a] rounded-full"
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PendingDLQCard({
  data,
}: {
  data:
    | Array<{
        _id: string
        name: string
        service: string
        attempts: number
        notes?: string
        _creationTime: number
      }>
    | undefined
}) {
  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
            <TrendingDown size={14} className="text-amber-400" />
          </div>
          Pending bookings (DLQ)
        </div>
        <span className="text-xs text-white/40">
          {data?.length ?? 0} queued
        </span>
      </div>

      <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
        {data === undefined && (
          <div className="text-xs text-white/30 py-3">Loading…</div>
        )}
        {data?.length === 0 && (
          <div className="text-xs text-white/30 py-3 text-center">
            All bookings synced ✓
          </div>
        )}
        {data?.map((p) => (
          <div
            key={p._id}
            className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{p.name}</div>
              <div className="text-[10px] text-white/40 truncate">
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
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-white/10 text-white/70",
    calling: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    booked: "bg-[#c4f54a]/20 text-[#c4f54a] border border-[#c4f54a]/30",
    declined: "bg-red-500/15 text-red-400 border border-red-500/20",
    no_answer: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    failed: "bg-red-500/15 text-red-400 border border-red-500/20",
  }
  return (
    <span className={`text-[10px] rounded-full px-2 py-0.5 ${map[status] ?? "bg-white/10 text-white/60"}`}>
      {status}
    </span>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

function relativeTime(t: number) {
  const diff = Date.now() - t
  const m = Math.floor(diff / 60000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}
