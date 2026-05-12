import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import {
  Users,
  Phone,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts"
import { api } from "../../../convex/_generated/api"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
})

type LeadStatus = "all" | "pending" | "calling" | "booked" | "declined" | "no_answer" | "failed"

function AdminDashboard() {
  const [activeFilter, setActiveFilter] = useState<LeadStatus>("all")

  const overview = useQuery(api.admin.overview)
  const byMonth = useQuery(api.admin.leadsByMonth, { months: 6, status: activeFilter })
  const heatmapTimes = useQuery(api.admin.leadHeatmap, { limit: 500, status: activeFilter })
  const recent = useQuery(api.admin.recentLeads, { limit: 8, status: activeFilter })
  const bestSvc = useQuery(api.admin.bestService)
  const pending = useQuery(api.admin.pendingBookings)

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
        <div className="mt-7">
          <FilterTabs active={activeFilter} onChange={setActiveFilter} />
        </div>
      </Reveal>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4 items-stretch">
        <Reveal delay={0.25} className="h-full"><LeadsBarCard data={byMonth} /></Reveal>
        <Reveal delay={0.3} className="h-full"><HeatmapCard times={heatmapTimes} /></Reveal>
        <Reveal delay={0.35} className="h-full"><RecentActivityCard recent={recent} /></Reveal>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <Reveal delay={0.4} className="h-full"><BestServiceCard data={bestSvc} /></Reveal>
        <Reveal delay={0.45} className="h-full"><PendingDLQCard data={pending} /></Reveal>
      </div>
    </>
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
      <div className="flex items-center gap-2 text-xs opacity-80">
        <div className={`w-7 h-7 rounded-full ${accent ? "bg-black/10" : "bg-white/5"} flex items-center justify-center`}>
          {icon}
        </div>
        {label}
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
  const peakIdx = months.reduce(
    (best, m, i) => (m.count > (months[best]?.count ?? 0) ? i : best),
    0,
  )
  const chartData = months.map((m, i) => ({
    name: m.label,
    count: m.count,
    isPeak: i === peakIdx && m.count > 0,
  }))

  return (
    <div className="h-full flex flex-col rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <Users size={14} className="text-white/70" />
          </div>
          Leads per month
        </div>
        <span className="text-[10px] text-white/40">last 6 months</span>
      </div>

      <div className="mt-6 flex-1 min-h-[240px] -ml-3 relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
          <BarChart data={chartData} margin={{ top: 18, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <pattern id="leadStripes" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(135)">
                <rect width="6" height="6" fill="#1f1f22" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              </pattern>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={<BarTooltip />}
            />
            <Bar dataKey="count" radius={[10, 10, 4, 4]} maxBarSize={48}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.isPeak ? "#a855f7" : "url(#leadStripes)"}
                  stroke={d.isPeak ? "transparent" : "rgba(255,255,255,0.08)"}
                  strokeWidth={d.isPeak ? 0 : 1}
                  strokeDasharray={d.isPeak ? "0" : "3 3"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: { isPeak?: boolean } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0
  const isPeak = payload[0]?.payload?.isPeak
  return (
    <div className="rounded-2xl bg-purple-500 text-white px-3 py-2 shadow-lg shadow-purple-500/20 text-center">
      {isPeak && (
        <div className="inline-block bg-white/20 rounded-full px-2 py-0.5 text-[9px] font-medium mb-1">
          Peak
        </div>
      )}
      <div className="text-[10px] opacity-80">{label} {new Date().getFullYear()}</div>
      <div className="text-lg font-display font-medium">{value.toLocaleString()}</div>
      <div className="text-[9px] opacity-80">leads</div>
    </div>
  )
}

const HEAT_HOURS = [6, 8, 10, 12, 14, 16, 18] // start of each 2h bucket
const HEAT_HOUR_LABELS = ["6a", "8a", "10a", "12p", "2p", "4p", "6p"]
const HEAT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function HeatmapCard({ times }: { times: Array<number> | undefined }) {
  const grid = useMemo(() => {
    const g: Array<Array<number>> = Array.from({ length: 7 }, () =>
      Array(HEAT_HOURS.length).fill(0),
    )
    if (!times) return g
    for (const t of times) {
      const d = new Date(t)
      const day = d.getDay()
      const hour = d.getHours()
      let bucket = -1
      for (let i = 0; i < HEAT_HOURS.length; i++) {
        const next = HEAT_HOURS[i + 1] ?? HEAT_HOURS[i] + 2
        if (hour >= HEAT_HOURS[i] && hour < next) {
          bucket = i
          break
        }
      }
      if (bucket >= 0) g[day][bucket]++
    }
    return g
  }, [times])

  const total = grid.flat().reduce((a, b) => a + b, 0)

  // Absolute opacity: 1 lead in a cell is intentionally faint; intensity
  // grows linearly, hitting full brightness around 10 leads/cell. This means
  // a single submission doesn't look "maxed out" just because it's the only
  // data point.
  const cellStyle = (n: number): React.CSSProperties => {
    if (n === 0) return { backgroundColor: "rgba(255,255,255,0.04)" }
    const opacity = Math.min(1, 0.22 + 0.09 * n)
    return { backgroundColor: `rgba(196, 245, 74, ${opacity.toFixed(3)})` }
  }

  return (
    <div className="h-full flex flex-col rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
              <Phone size={14} className="text-white/70" />
            </div>
            When leads come in
          </div>
          <div className="text-[10px] text-white/40 mt-1 ml-9">
            Form submissions by day &amp; hour (your time)
          </div>
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">{total} total</span>
      </div>

      <div className="mt-6 grid grid-cols-[auto_repeat(7,1fr)] gap-1.5">
        {[...HEAT_HOUR_LABELS]
          .map((_, i) => HEAT_HOUR_LABELS.length - 1 - i)
          .flatMap((hourIdx) => [
            <div
              key={`lab-${hourIdx}`}
              className="text-[9px] text-white/40 flex items-center justify-end pr-1"
            >
              {HEAT_HOUR_LABELS[hourIdx]}
            </div>,
            ...HEAT_DAYS.map((_, dayIdx) => {
              const n = grid[dayIdx]?.[hourIdx] ?? 0
              return (
                <div
                  key={`${dayIdx}-${hourIdx}`}
                  className="aspect-square rounded transition-colors duration-200"
                  style={cellStyle(n)}
                  title={`${HEAT_DAYS[dayIdx]} ${HEAT_HOUR_LABELS[hourIdx]}: ${n}`}
                />
              )
            }),
          ])}
        <div />
        {HEAT_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-white/40 mt-1">
            {d}
          </div>
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
    <div className="h-full flex flex-col rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <Users size={14} className="text-white/70" />
          </div>
          Recent leads
        </div>
      </div>

      <div className="mt-4 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
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
    <div className="h-full flex flex-col rounded-3xl bg-[#101012] border border-white/5 p-5">
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

      <div className="mt-5 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
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
    <div className="h-full flex flex-col rounded-3xl bg-[#101012] border border-white/5 p-5">
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

      <div className="mt-4 flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
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
