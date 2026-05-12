import { Link, useLocation } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  LayoutDashboard,
  Users,
  Phone,
  CalendarCheck,
  ScrollText,
  ChevronDown,
  LogOut,
  Wrench,
} from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { authClient } from "#/lib/auth-client"

type NavItem = {
  to:
    | "/admin"
    | "/admin/leads"
    | "/admin/calls"
    | "/admin/bookings"
    | "/admin/logs"
    | "/admin/devtools"
  label: string
  icon: React.ReactNode
  badgeQuery?: "pendingBookings"
  dropdown?: boolean
}

const ITEMS: Array<NavItem> = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={14} /> },
  { to: "/admin/leads", label: "Leads", icon: <Users size={14} />, dropdown: false },
  { to: "/admin/calls", label: "Calls", icon: <Phone size={14} /> },
  { to: "/admin/bookings", label: "Bookings", icon: <CalendarCheck size={14} /> },
  { to: "/admin/logs", label: "Logs", icon: <ScrollText size={14} />, badgeQuery: "pendingBookings" },
  { to: "/admin/devtools", label: "Dev tools", icon: <Wrench size={14} /> },
]

export function TopNav() {
  const { data: session } = authClient.useSession()
  const location = useLocation()
  const pending = useQuery(api.admin.pendingBookings)
  const dlqCount = pending?.length ?? 0

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/admin" className="w-9 h-9 rounded-xl bg-[#c4f54a] flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-black">
            <path d="M4 18L12 4L20 18H4Z" fill="currentColor" />
          </svg>
        </Link>
        <nav className="hidden md:flex items-center gap-1 bg-[#101012] border border-white/5 rounded-full p-1">
          {ITEMS.map((item) => {
            const active = location.pathname === item.to
            const badge = item.badgeQuery === "pendingBookings" && dlqCount > 0 ? String(dlqCount) : undefined
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  active
                    ? "bg-[#c4f54a] text-black font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
                {item.dropdown && <ChevronDown size={12} />}
                {badge && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-400 text-black text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/admin/password"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 rounded-full px-3 py-2 transition-colors"
          title={session?.user.email}
        >
          {session?.user.email?.split("@")[0] ?? "admin"}
        </Link>
        <button
          onClick={async () => {
            await authClient.signOut()
            window.location.href = "/admin/login"
          }}
          className="w-9 h-9 rounded-full bg-purple-500/80 hover:bg-purple-500 transition-colors inline-flex items-center justify-center"
          title="Sign out"
        >
          <LogOut size={14} className="text-white" />
        </button>
      </div>
    </div>
  )
}
