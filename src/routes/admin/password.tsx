import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Lock, Check, ArrowLeft } from "lucide-react"
import { authClient } from "#/lib/auth-client"

export const Route = createFileRoute("/admin/password")({
  component: PasswordPage,
})

function PasswordPage() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (next.length < 5) {
      setError("New password must be at least 5 characters.")
      return
    }
    if (next !== repeat) {
      setError("New passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const result = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      })
      if (result.error) {
        setError(result.error.message ?? "Failed to change password")
      } else {
        setDone(true)
        setCurrent("")
        setNext("")
        setRepeat("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#c4f54a] rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-[#1a1a1c] border border-white/5 p-8 text-center">
          <h1 className="text-xl font-display mb-2">Sign in first</h1>
          <p className="text-sm text-white/50 mb-6">
            To change your password you need to be signed in. We don't have an
            email-based reset flow yet — sign in with your current credentials,
            then change your password here.
          </p>
          <button
            onClick={() => navigate({ to: "/admin/login" })}
            className="rounded-full bg-[#c4f54a] text-black font-medium px-6 py-3 hover:bg-[#d2ff5a] transition-all"
          >
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/admin"
          className="text-sm text-white/50 hover:text-white mb-6 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <div className="rounded-3xl bg-[#1a1a1c] border border-white/5 p-8 shadow-2xl">
          <h1 className="text-2xl font-display mb-1">Change password</h1>
          <p className="text-sm text-white/50 mb-8">
            Signed in as <span className="text-white">{session.user.email}</span>
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Current password"
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
            />
            <Field
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
            />
            <Field
              label="Repeat new password"
              value={repeat}
              onChange={setRepeat}
              autoComplete="new-password"
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {done && (
              <div className="text-sm text-[#c4f54a] bg-[#c4f54a]/10 border border-[#c4f54a]/20 rounded-xl px-4 py-3 inline-flex items-center gap-2">
                <Check size={14} /> Password updated. Other sessions revoked.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-full bg-[#c4f54a] text-black font-medium py-3.5 hover:bg-[#d2ff5a] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  return (
    <label className="block">
      <div className="text-xs text-white/50 mb-2">{label}</div>
      <div className="relative">
        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="w-full bg-[#101012] border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#c4f54a]/40 focus:ring-2 focus:ring-[#c4f54a]/10 transition-all"
        />
      </div>
    </label>
  )
}
