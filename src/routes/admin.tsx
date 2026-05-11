import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { convexReactClient } from "#/lib/convex-react"
import { authClient } from "#/lib/auth-client"
import { TopNav } from "#/components/admin/TopNav"

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <ConvexBetterAuthProvider client={convexReactClient} authClient={authClient}>
      <AuthGate>
        <Frame />
      </AuthGate>
    </ConvexBetterAuthProvider>
  )
}

function Frame() {
  const location = useLocation()
  const isAuthPage =
    location.pathname === "/admin/login" || location.pathname === "/admin/password"

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-[#0e0e0f] text-white antialiased">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0e0e0f] text-white antialiased">
      <DesktopOnlyNotice />
      <div className="hidden lg:block px-4 sm:px-6 lg:px-10 py-6">
        <div className="mx-auto max-w-[1400px] rounded-[28px] bg-[#1a1a1c] border border-white/5 p-5 sm:p-7 lg:p-8">
          <TopNav />
          <div className="mt-7">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

function DesktopOnlyNotice() {
  const [width, setWidth] = useState<number | null>(null)
  useEffect(() => {
    setWidth(window.innerWidth)
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div className="lg:hidden min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#c4f54a]/10 border border-[#c4f54a]/20 flex items-center justify-center mb-6">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4f54a]">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>
      <h1 className="font-display text-4xl sm:text-5xl mb-4 leading-tight">
        Desktop only
      </h1>
      <p className="text-white/50 max-w-sm text-sm leading-relaxed">
        The Shalom Cleans admin console is designed for wider screens. Please
        open this on a desktop or expand your browser window to at least
        1024&nbsp;px wide.
      </p>
      {width != null && (
        <div className="mt-8 text-xs text-white/30 font-mono">
          current width: <span className="text-white/60">{width}</span> px
        </div>
      )}
    </div>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const isLoginPage = location.pathname === "/admin/login"

  useEffect(() => {
    if (isPending) return
    if (!session && !isLoginPage) {
      navigate({ to: "/admin/login", replace: true })
    }
    if (session && isLoginPage) {
      navigate({ to: "/admin", replace: true })
    }
  }, [session, isPending, isLoginPage, navigate])

  if (isPending) {
    return (
      <div className="min-h-screen w-full bg-[#0e0e0f] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#c4f54a] rounded-full animate-spin" />
      </div>
    )
  }

  if (!session && !isLoginPage) {
    return (
      <div className="min-h-screen w-full bg-[#0e0e0f] text-white flex items-center justify-center" />
    )
  }

  return <>{children}</>
}
