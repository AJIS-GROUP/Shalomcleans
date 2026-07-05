import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { authClient } from "#/lib/auth-client"

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? "Sign in failed")
      } else {
        navigate({ to: "/admin", replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c4f54a] flex items-center justify-center text-black font-bold text-lg">
            S
          </div>
          <div>
            <div className="font-display text-xl">Shalomcleans</div>
            <div className="text-xs text-white/40">Admin console</div>
          </div>
        </div>

        <div className="rounded-3xl bg-[#1a1a1c] border border-white/5 p-8 shadow-2xl">
          <h1 className="text-2xl font-display mb-1">Welcome back</h1>
          <p className="text-sm text-white/50 mb-8">Sign in to access the admin dashboard.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              icon={<Mail size={16} />}
              type="email"
              placeholder="admin@ogaticket.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              icon={<Lock size={16} />}
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-full bg-[#c4f54a] text-black font-medium py-3.5 hover:bg-[#d2ff5a] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? "Signing in…" : (<>
                Sign in <ArrowRight size={16} />
              </>)}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-white/50">
            <Link to="/admin/password" className="hover:text-[#c4f54a] transition-colors">
              Forgot password?
            </Link>
            <Link to="/" className="hover:text-white transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: {
  icon: React.ReactNode
  type: "email" | "password" | "text"
  placeholder: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  required?: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === "password"
  const effectiveType = isPassword && revealed ? "text" : type
  return (
    <label className="block">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
          {icon}
        </div>
        <input
          type={effectiveType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className={`w-full bg-[#101012] border border-white/5 rounded-2xl pl-11 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c4f54a]/40 focus:ring-2 focus:ring-[#c4f54a]/10 transition-all ${
            isPassword ? "pr-11" : "pr-4"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </label>
  )
}
