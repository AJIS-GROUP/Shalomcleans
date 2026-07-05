import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import {
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Trash2,
  StickyNote,
  PhoneCall,
  Send,
} from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { ChoiceDialog, ConfirmDialog } from "#/components/admin/crm/dialogs"
import { contactDisplayName } from "#/lib/crm/display"

export function ContactDrawer({
  contactId,
  onClose,
}: {
  contactId: Id<"contacts">
  onClose: () => void
}) {
  const detail = useQuery(api.crmQueries.getContact, { contactId })
  const addNote = useMutation(api.crmMutations.addNote)
  const logInteraction = useMutation(api.crmMutations.logInteraction)
  const addTag = useMutation(api.crmMutations.addTag)
  const removeTag = useMutation(api.crmMutations.removeTag)
  const deleteContact = useMutation(api.crmMutations.deleteContact)

  const [note, setNote] = useState("")
  const [newTag, setNewTag] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [interaction, setInteraction] = useState<null | "call" | "email">(null)

  const contact = detail?.contact

  const addNoteNow = async () => {
    const body = note.trim()
    if (!body) return
    await addNote({ contactId, body })
    setNote("")
  }

  const logInteractionNow = async (kind: "call" | "email") => {
    await logInteraction({ contactId, kind, body: note.trim() || undefined })
    setNote("")
  }

  // Ask whether to actually reach out or just log it — unless there's nothing
  // to dial/email, in which case just log.
  const startInteraction = (kind: "call" | "email") => {
    const target = kind === "call" ? contact?.phone : contact?.email
    if (!target) {
      void logInteractionNow(kind)
      return
    }
    setInteraction(kind)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md bg-[#1a1a1c] border-l border-white/5 p-7 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="min-w-0">
            <div className="font-display text-lg truncate">
              {contact ? contactDisplayName(contact) : "Contact"}
            </div>
            {contact?.title && (
              <div className="text-xs text-white/40">{contact.title}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {!detail ? (
          <div className="text-white/30 text-xs py-8 text-center">Loading…</div>
        ) : contact ? (
          <>
            {contact.email && <Row icon={<Mail size={14} />} value={contact.email} />}
            {contact.phone && <Row icon={<Phone size={14} />} value={contact.phone} />}
            {contact.company && (
              <Row icon={<Building2 size={14} />} value={contact.company} />
            )}
            {contact.title && (
              <Row icon={<Briefcase size={14} />} value={contact.title} />
            )}

            {contact.custom && Object.keys(contact.custom).length > 0 && (
              <div className="mt-4 space-y-1.5">
                {Object.entries(contact.custom).map(([k, val]) => (
                  <div key={k} className="flex justify-between gap-3 text-xs">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white/80 truncate">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="mt-5">
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {(contact.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] rounded-full bg-white/10 text-white/70 pl-2 pr-1 py-0.5"
                  >
                    {t}
                    <button
                      onClick={() => removeTag({ contactId, tag: t })}
                      className="w-4 h-4 rounded-full hover:bg-white/10 inline-flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const t = newTag.trim()
                    if (t) {
                      void addTag({ contactId, tag: t })
                      setNewTag("")
                    }
                  }}
                  className="inline-flex items-center"
                >
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="add tag"
                    className="w-20 bg-[#101012] border border-white/10 rounded-full px-2 py-0.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#c4f54a]/40"
                  />
                </form>
              </div>
            </div>

            {/* Campaign memberships */}
            {detail.memberships.length > 0 && (
              <div className="mt-5">
                <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
                  Campaigns
                </div>
                <div className="space-y-1">
                  {detail.memberships.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between text-xs bg-[#101012] border border-white/5 rounded-lg px-3 py-2"
                    >
                      <span className="text-white/80 truncate">{m.campaignName}</span>
                      <span
                        className="text-[10px] rounded-full px-2 py-0.5"
                        style={{
                          background: `${m.stageColor ?? "#888"}22`,
                          color: m.stageColor ?? "#aaa",
                        }}
                      >
                        {m.stageName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add note / log */}
            <div className="mt-5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="w-full bg-[#101012] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#c4f54a]/40 resize-none"
              />
              <div className="flex gap-1.5 mt-2">
                <LogButton icon={<StickyNote size={12} />} label="Note" onClick={addNoteNow} />
                <LogButton icon={<PhoneCall size={12} />} label="Call" onClick={() => startInteraction("call")} />
                <LogButton icon={<Send size={12} />} label="Email" onClick={() => startInteraction("email")} />
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
                Activity
              </div>
              <div className="space-y-3">
                {detail.activities.map((a) => (
                  <div key={a._id} className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white/80">{describeActivity(a)}</div>
                      <div className="text-[10px] text-white/30">
                        {new Date(a.at ?? a._creationTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setConfirmDelete(true)}
              className="mt-7 inline-flex items-center gap-2 text-xs text-red-300 hover:bg-red-500/15 border border-red-500/20 rounded-full px-4 py-2 transition-colors"
            >
              <Trash2 size={13} /> Delete contact
            </button>

            {confirmDelete && (
              <ConfirmDialog
                title="Delete contact?"
                message="This permanently removes the contact and their history from every campaign."
                confirmLabel="Delete"
                danger
                onConfirm={async () => {
                  await deleteContact({ contactId })
                  onClose()
                }}
                onClose={() => setConfirmDelete(false)}
              />
            )}

            {interaction &&
              (() => {
                const kind = interaction
                const target = kind === "call" ? contact.phone : contact.email
                return (
                  <ChoiceDialog
                    title={`${kind === "call" ? "Call" : "Email"} ${contactDisplayName(contact)}`}
                    message={target}
                    primary={{
                      label: kind === "call" ? "Call now" : "Compose email",
                      onClick: () => {
                        if (target) {
                          window.location.href =
                            kind === "call" ? `tel:${target}` : `mailto:${target}`
                        }
                        void logInteractionNow(kind)
                      },
                    }}
                    secondary={{
                      label: `Just log the ${kind}`,
                      onClick: () => void logInteractionNow(kind),
                    }}
                    onClose={() => setInteraction(null)}
                  />
                )
              })()}
          </>
        ) : (
          <div className="text-white/30 text-xs py-8 text-center">
            Contact not found.
          </div>
        )}
      </aside>
    </div>
  )
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5">
      <span className="text-white/30">{icon}</span>
      <span className="text-sm text-white break-all">{value}</span>
    </div>
  )
}

function LogButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 text-[11px] text-white/70 px-3 py-1.5 hover:bg-white/10 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

function describeActivity(a: {
  type: string
  body?: string
  meta?: unknown
}): string {
  const meta = (a.meta ?? {}) as Record<string, unknown>
  switch (a.type) {
    case "created":
      return "Contact created"
    case "import":
      return "Added via import"
    case "stage_change":
      return `Moved ${meta.from ? `from ${meta.from} ` : ""}to ${meta.to ?? "a stage"}`
    case "tag":
      return `Tagged ${meta.added ?? ""}`
    case "note":
      return a.body ? `Note: ${a.body}` : "Note added"
    case "call":
      return a.body ? `Call: ${a.body}` : "Call logged"
    case "email":
      return a.body ? `Email: ${a.body}` : "Email logged"
    default:
      return a.type
  }
}
