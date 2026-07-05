import { useState } from "react"
import { X } from "lucide-react"

/** Shared centered modal shell — dark card over a dimmed backdrop. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#1a1a1c] border border-white/10 rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** A single-field text prompt — the modal replacement for window.prompt. */
export function PromptDialog({
  title,
  label,
  placeholder,
  initialValue = "",
  submitLabel = "Save",
  onSubmit,
  onClose,
}: {
  title: string
  label?: string
  placeholder?: string
  initialValue?: string
  submitLabel?: string
  onSubmit: (value: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = value.trim()
          if (!trimmed) return
          onSubmit(trimmed)
        }}
      >
        {label && (
          <label className="block text-[11px] uppercase tracking-wide text-white/40 mb-1.5">
            {label}
          </label>
        )}
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#101012] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c4f54a]/40 focus:ring-2 focus:ring-[#c4f54a]/10"
        />
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 text-xs text-white/70 px-4 py-2 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-[#c4f54a] text-black text-xs font-semibold px-5 py-2 hover:bg-[#d4ff5a] active:scale-95 transition"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** A yes/no confirmation — the modal replacement for window.confirm. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      {message && <p className="text-sm text-white/60 mb-5">{message}</p>}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-full border border-white/10 text-xs text-white/70 px-4 py-2 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={`rounded-full text-xs font-semibold px-5 py-2 active:scale-95 transition ${
            danger
              ? "bg-red-500/90 text-white hover:bg-red-500"
              : "bg-[#c4f54a] text-black hover:bg-[#d4ff5a]"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
