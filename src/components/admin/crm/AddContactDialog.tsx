import { useState } from "react"
import { useMutation } from "convex/react"
import { AlertCircle } from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { Modal } from "#/components/admin/crm/dialogs"

type Form = {
  name: string
  email: string
  phone: string
  company: string
  title: string
}

const EMPTY: Form = { name: "", email: "", phone: "", company: "", title: "" }

export function AddContactDialog({
  campaignId,
  campaignName,
  onClose,
}: {
  campaignId: Id<"campaigns">
  campaignName: string
  onClose: () => void
}) {
  const createContact = useMutation(api.crmMutations.createContact)
  const [form, setForm] = useState<Form>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof Form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Add at least an email or a phone number.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createContact({
        campaignId,
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        title: form.title.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the contact.")
      setSaving(false)
    }
  }

  return (
    <Modal title={`Add contact to ${campaignName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-2.5">
        <Field label="Name" value={form.name} onChange={set("name")} autoFocus />
        <div className="grid grid-cols-2 gap-2.5">
          <Field
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
          />
          <Field label="Phone" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Company" value={form.company} onChange={set("company")} />
          <Field label="Title" value={form.title} onChange={set("title")} />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 text-xs text-white/70 px-4 py-2 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#c4f54a] text-black text-xs font-semibold px-5 py-2 hover:bg-[#d4ff5a] active:scale-95 transition disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add contact"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoFocus?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#101012] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c4f54a]/40 focus:ring-2 focus:ring-[#c4f54a]/10"
      />
    </label>
  )
}
