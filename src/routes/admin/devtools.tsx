import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation } from "convex/react"
import { Phone, Mail, Globe, Trash2, AlertOctagon, Check } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/devtools")({
  component: DevToolsPage,
})

type Toast = { kind: "success" | "error"; message: string } | null

function DevToolsPage() {
  const clearPhone = useMutation(api.devTools.clearPhoneRateLimitAdmin)
  const clearEmail = useMutation(api.devTools.clearEmailRateLimitAdmin)
  const clearGlobal = useMutation(api.devTools.clearGlobalRateLimitAdmin)
  const wipeAll = useMutation(api.devTools.wipeAllAdmin)

  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id)
    setToast(null)
    try {
      await fn()
      setToast({ kind: "success", message: ok })
    } catch (err) {
      setToast({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Reveal>
        <div className="mb-6">
          <h1 className="font-display text-3xl">Dev tools</h1>
          <p className="text-sm text-white/40 mt-1">
            Reset rate limits and wipe data. Admin-only. Acts on the current Convex deployment.
          </p>
        </div>
      </Reveal>

      {toast && (
        <Reveal>
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm border ${
              toast.kind === "success"
                ? "bg-[#c4f54a]/10 border-[#c4f54a]/20 text-[#c4f54a]"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.kind === "success" ? (
                <Check size={14} />
              ) : (
                <AlertOctagon size={14} />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        </Reveal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Reveal delay={0.05}>
          <Card
            icon={<Phone size={14} />}
            title="Reset rate limit by phone"
            hint="Clears the bookingByPhone token bucket. Phone is normalized to E.164."
          >
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="4049907052"
              className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c4f54a]/40"
            />
            <button
              disabled={!phone.trim() || busy === "phone"}
              onClick={() =>
                run(
                  "phone",
                  () => clearPhone({ phone: phone.trim() }),
                  `Cleared phone rate limit for ${phone.trim()}`,
                )
              }
              className="rounded-xl bg-[#c4f54a] text-black font-medium px-5 py-2.5 text-sm hover:bg-[#d2ff5a] disabled:opacity-50 transition-all"
            >
              {busy === "phone" ? "Clearing…" : "Clear"}
            </button>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card
            icon={<Mail size={14} />}
            title="Reset rate limit by email"
            hint="Clears the bookingByEmail token bucket."
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c4f54a]/40"
            />
            <button
              disabled={!email.trim() || busy === "email"}
              onClick={() =>
                run(
                  "email",
                  () => clearEmail({ email: email.trim() }),
                  `Cleared email rate limit for ${email.trim().toLowerCase()}`,
                )
              }
              className="rounded-xl bg-[#c4f54a] text-black font-medium px-5 py-2.5 text-sm hover:bg-[#d2ff5a] disabled:opacity-50 transition-all"
            >
              {busy === "email" ? "Clearing…" : "Clear"}
            </button>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card
            icon={<Globe size={14} />}
            title="Reset global rate limit"
            hint="Clears the deployment-wide bookingGlobal bucket."
          >
            <button
              disabled={busy === "global"}
              onClick={() =>
                run("global", () => clearGlobal({}), "Cleared global rate limit")
              }
              className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm px-5 py-2.5 disabled:opacity-50 transition-all"
            >
              {busy === "global" ? "Clearing…" : "Clear global bucket"}
            </button>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <div className="mt-6 rounded-3xl bg-red-500/5 border border-red-500/20 p-6">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <AlertOctagon size={16} />
            <h2 className="font-display text-lg">Danger zone</h2>
          </div>
          <p className="text-sm text-white/50 mb-4">
            Deletes every row from the <span className="font-mono">leads</span> and{" "}
            <span className="font-mono">events</span> tables. Does not touch auth or
            rate-limiter component data. Type <span className="font-mono text-red-300">WIPE</span> to confirm.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type WIPE"
              className="flex-1 bg-[#0a0a0c] border border-red-500/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400/60"
            />
            <button
              disabled={confirm !== "WIPE" || busy === "wipe"}
              onClick={() =>
                run(
                  "wipe",
                  async () => {
                    const r = (await wipeAll({ confirm })) as {
                      deletedLeads: number
                      deletedEvents: number
                    }
                    setConfirm("")
                    return r
                  },
                  "Database wiped",
                )
              }
              className="rounded-xl bg-red-500 hover:bg-red-400 text-white font-medium px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 size={14} />
              {busy === "wipe" ? "Wiping…" : "Wipe leads + events"}
            </button>
          </div>
        </div>
      </Reveal>
    </>
  )
}

function Card({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 p-5">
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className="text-white/40">{icon}</span>
        <span className="text-white">{title}</span>
      </div>
      <p className="text-xs text-white/40 mb-4">{hint}</p>
      <div className="flex flex-col sm:flex-row gap-2">{children}</div>
    </div>
  )
}
