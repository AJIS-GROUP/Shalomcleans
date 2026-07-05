import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useRef, useState } from "react"
import { useAction, useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Search,
  Plus,
  Mail,
  Phone,
  Tag,
  Trash2,
  Download,
  X,
  UploadCloud,
  LayoutList,
  Columns3,
  Settings2,
} from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { Reveal } from "#/components/admin/Reveal"
import { ImportDialog } from "#/components/admin/crm/ImportDialog"
import { ConfirmDialog, PromptDialog } from "#/components/admin/crm/dialogs"
import { Board } from "#/components/admin/crm/Board"
import { ContactDrawer } from "#/components/admin/crm/ContactDrawer"
import { StageEditor } from "#/components/admin/crm/StageEditor"
import { contactsToCsv } from "#/lib/crm/csv"
import { contactDisplayName } from "#/lib/crm/display"
import {
  emptySelection,
  isRowSelected,
  selectAllMatching,
  selectionCount,
  toggleRow,
  type Selection,
} from "#/lib/crm/selection"

export const Route = createFileRoute("/admin/crm")({ component: CrmPage })

type ContactRow = Doc<"contacts"> & {
  membershipId?: Id<"memberships">
  stageId?: Id<"stages">
}

function CrmPage() {
  const [campaignId, setCampaignId] = useState<Id<"campaigns"> | null>(null)
  const [stageId, setStageId] = useState<Id<"stages"> | null>(null)
  const [search, setSearch] = useState("")
  const [facet, setFacet] = useState<{ hasEmail?: boolean; hasPhone?: boolean }>({})
  const [tag] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>(emptySelection())
  const [importOpen, setImportOpen] = useState(false)
  const [newCampaignOpen, setNewCampaignOpen] = useState(false)
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState(false)
  const [view, setView] = useState<"table" | "board">("table")
  const [stageEditorOpen, setStageEditorOpen] = useState(false)
  const [activeContactId, setActiveContactId] = useState<Id<"contacts"> | null>(
    null,
  )

  const campaigns = useQuery(api.crmQueries.listCampaigns)
  const stages = useQuery(
    api.crmQueries.listStages,
    campaignId ? { campaignId } : "skip",
  )
  const createCampaign = useMutation(api.crmMutations.createCampaign)
  const deleteCampaignAction = useAction(api.crmCampaign.deleteCampaign)

  const filterArgs = useMemo(
    () => ({
      campaignId: campaignId ?? undefined,
      stageId: stageId ?? undefined,
      search: search.trim() || undefined,
      hasEmail: facet.hasEmail,
      hasPhone: facet.hasPhone,
      tag: tag ?? undefined,
    }),
    [campaignId, stageId, search, facet, tag],
  )

  const { results, status, loadMore } = usePaginatedQuery(
    api.crmQueries.listContacts,
    filterArgs,
    { initialNumItems: 50 },
  )

  const stageMap = useMemo(
    () => new Map((stages ?? []).map((s) => [s._id, s] as const)),
    [stages],
  )

  const knownTotal = useMemo(() => {
    if (campaignId && stageId) return stageMap.get(stageId)?.count ?? results.length
    if (campaignId)
      return (
        campaigns?.find((c) => c._id === campaignId)?.contactCount ??
        results.length
      )
    return undefined
  }, [campaignId, stageId, stageMap, campaigns, results.length])

  const count = selectionCount(selection, knownTotal ?? results.length)

  // Every filter change resets the selection — a "select all matching" from the
  // old filter must never apply to a new one.
  const resetTo = (fn: () => void) => {
    fn()
    setSelection(emptySelection())
  }
  const chooseCampaign = (id: Id<"campaigns"> | null) =>
    resetTo(() => {
      setCampaignId(id)
      setStageId(null)
      setSearch("")
      setFacet({})
    })

  const createNamedCampaign = async (name: string) => {
    const id = await createCampaign({ name })
    setNewCampaignOpen(false)
    chooseCampaign(id)
  }

  return (
    <div className="flex gap-5">
      <CampaignRail
        campaigns={campaigns}
        activeId={campaignId}
        onChoose={chooseCampaign}
        onNew={() => setNewCampaignOpen(true)}
      />

      <div className="flex-1 min-w-0">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="font-display text-3xl">
                {campaignId
                  ? campaigns?.find((c) => c._id === campaignId)?.name ?? "Campaign"
                  : "All contacts"}
              </h1>
              <p className="text-sm text-white/40 mt-1">
                {knownTotal !== undefined
                  ? `${knownTotal.toLocaleString()} contacts`
                  : "Every contact across your outreach"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {campaignId && (
                <div className="inline-flex items-center bg-[#101012] border border-white/5 rounded-full p-0.5">
                  <ViewToggle
                    active={view === "table"}
                    onClick={() => setView("table")}
                    icon={<LayoutList size={13} />}
                    title="Table view"
                  />
                  <ViewToggle
                    active={view === "board"}
                    onClick={() => setView("board")}
                    icon={<Columns3 size={13} />}
                    title="Board view"
                  />
                </div>
              )}
              {campaignId && (
                <button
                  onClick={() => setStageEditorOpen(true)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
                  title="Edit pipeline stages"
                >
                  <Settings2 size={14} />
                </button>
              )}
              {campaignId && (
                <button
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 text-xs text-white/80 px-4 py-2 hover:bg-white/5 transition-colors"
                  title="Import contacts from a CSV or spreadsheet"
                >
                  <UploadCloud size={14} /> Import
                </button>
              )}
              {campaignId && (
                <button
                  onClick={() => setConfirmDeleteCampaign(true)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-500/20 text-red-300/80 hover:bg-red-500/15 transition-colors"
                  title="Delete this campaign"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  value={search}
                  onChange={(e) => resetTo(() => setSearch(e.target.value))}
                  placeholder="Name, email, company…"
                  className="w-64 bg-[#101012] border border-white/5 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#c4f54a]/40 focus:ring-2 focus:ring-[#c4f54a]/10"
                />
              </div>
            </div>
          </div>
        </Reveal>

        {campaignId && view === "board" ? (
          <Reveal delay={0.06}>
            <Board campaignId={campaignId} onOpenContact={setActiveContactId} />
          </Reveal>
        ) : (
          <>
            <Reveal delay={0.06}>
              <FilterChips
                stages={stages}
                stageId={stageId}
                onStage={(id) => resetTo(() => setStageId(id))}
                facet={facet}
                onFacet={(f) => resetTo(() => setFacet(f))}
              />
            </Reveal>

            <Reveal delay={0.12}>
              <ContactsTable
                results={results as Array<ContactRow>}
                status={status}
                loadMore={loadMore}
                selection={selection}
                setSelection={setSelection}
                stageMap={stageMap}
                showStage={!!campaignId}
                onOpenContact={setActiveContactId}
              />
            </Reveal>

            {count > 0 && (
              <BulkBar
                count={count}
                selection={selection}
                loadedCount={results.length}
                knownTotal={knownTotal}
                onSelectAllMatching={() =>
                  setSelection(selectAllMatching(knownTotal ?? results.length))
                }
                onClear={() => setSelection(emptySelection())}
                campaignId={campaignId}
                stages={stages}
                filterArgs={filterArgs}
                results={results as Array<ContactRow>}
              />
            )}
          </>
        )}
      </div>

      {activeContactId && (
        <ContactDrawer
          contactId={activeContactId}
          onClose={() => setActiveContactId(null)}
        />
      )}

      {stageEditorOpen && campaignId && (
        <StageEditor
          campaignId={campaignId}
          onClose={() => setStageEditorOpen(false)}
        />
      )}

      {newCampaignOpen && (
        <PromptDialog
          title="New campaign"
          label="Campaign name"
          placeholder="Miami cold — Feb"
          submitLabel="Create"
          onSubmit={createNamedCampaign}
          onClose={() => setNewCampaignOpen(false)}
        />
      )}

      {confirmDeleteCampaign && campaignId && (
        <ConfirmDialog
          title="Delete campaign?"
          message="This deletes the campaign, its pipeline, and every contact that isn't in another campaign. Contacts shared with another campaign are kept."
          confirmLabel="Delete campaign"
          danger
          onConfirm={async () => {
            const id = campaignId
            chooseCampaign(null)
            await deleteCampaignAction({ campaignId: id })
          }}
          onClose={() => setConfirmDeleteCampaign(false)}
        />
      )}

      {importOpen && campaignId && (
        <ImportDialog
          campaignId={campaignId}
          campaignName={
            campaigns?.find((c) => c._id === campaignId)?.name ?? "campaign"
          }
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  )
}

function CampaignRail({
  campaigns,
  activeId,
  onChoose,
  onNew,
}: {
  campaigns: Array<Doc<"campaigns">> | undefined
  activeId: Id<"campaigns"> | null
  onChoose: (id: Id<"campaigns"> | null) => void
  onNew: () => void
}) {
  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <button
        onClick={onNew}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#c4f54a] text-black text-xs font-semibold px-4 py-2.5 hover:bg-[#d4ff5a] active:scale-95 transition mb-4"
      >
        <Plus size={14} /> New campaign
      </button>
      <RailItem
        label="All contacts"
        active={activeId === null}
        onClick={() => onChoose(null)}
      />
      <div className="mt-2 space-y-0.5">
        {campaigns?.map((c) => (
          <RailItem
            key={c._id}
            label={c.name}
            count={c.contactCount}
            color={c.color}
            active={activeId === c._id}
            onClick={() => onChoose(c._id)}
          />
        ))}
        {campaigns?.length === 0 && (
          <p className="text-[11px] text-white/30 px-3 py-2">
            No campaigns yet. Create one to import contacts.
          </p>
        )}
      </div>
    </aside>
  )
}

function RailItem({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string
  count?: number
  color?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs text-left transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color ?? "#c4f54a" }}
        />
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span className="text-white/30 shrink-0">{count.toLocaleString()}</span>
      )}
    </button>
  )
}

function FilterChips({
  stages,
  stageId,
  onStage,
  facet,
  onFacet,
}: {
  stages: Array<Doc<"stages">> | undefined
  stageId: Id<"stages"> | null
  onStage: (id: Id<"stages"> | null) => void
  facet: { hasEmail?: boolean; hasPhone?: boolean }
  onFacet: (f: { hasEmail?: boolean; hasPhone?: boolean }) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 mb-4">
      {stages && (
        <>
          <Chip active={stageId === null} onClick={() => onStage(null)}>
            All stages
          </Chip>
          {stages.map((s) => (
            <Chip
              key={s._id}
              active={stageId === s._id}
              onClick={() => onStage(s._id)}
              dot={s.color}
            >
              {s.name}
              <span className="ml-1.5 opacity-50">{s.count ?? 0}</span>
            </Chip>
          ))}
          <span className="w-px h-5 bg-white/10 mx-1" />
        </>
      )}
      <Chip
        active={facet.hasEmail === true}
        onClick={() =>
          onFacet({ ...facet, hasEmail: facet.hasEmail ? undefined : true })
        }
      >
        <Mail size={11} /> Has email
      </Chip>
      <Chip
        active={facet.hasPhone === true}
        onClick={() =>
          onFacet({ ...facet, hasPhone: facet.hasPhone ? undefined : true })
        }
      >
        <Phone size={11} /> Has phone
      </Chip>
    </div>
  )
}

function Chip({
  children,
  active,
  onClick,
  dot,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  dot?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
        active
          ? "bg-[#c4f54a] text-black font-medium"
          : "text-white/60 hover:bg-white/5 border border-white/5"
      }`}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dot }}
        />
      )}
      {children}
    </button>
  )
}

function ViewToggle({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-8 h-7 rounded-full transition-colors ${
        active ? "bg-[#c4f54a] text-black" : "text-white/50 hover:text-white"
      }`}
    >
      {icon}
    </button>
  )
}

function ContactsTable({
  results,
  status,
  loadMore,
  selection,
  setSelection,
  stageMap,
  showStage,
  onOpenContact,
}: {
  results: Array<ContactRow>
  status: string
  loadMore: (n: number) => void
  selection: Selection
  setSelection: (s: Selection) => void
  stageMap: Map<Id<"stages">, Doc<"stages">>
  showStage: boolean
  onOpenContact: (id: Id<"contacts">) => void
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 12,
  })

  const allLoadedSelected =
    selection.mode === "all" ||
    (selection.mode === "ids" &&
      results.length > 0 &&
      results.every((r) => selection.ids.has(r._id)))

  const toggleAllLoaded = () => {
    if (allLoadedSelected) return setSelection(emptySelection())
    setSelection({ mode: "ids", ids: new Set(results.map((r) => r._id)) })
  }

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (
      status === "CanLoadMore" &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 500
    ) {
      loadMore(50)
    }
  }

  return (
    <div className="rounded-3xl bg-[#101012] border border-white/5 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wide text-white/40 border-b border-white/5 bg-white/[0.02]">
        <input
          type="checkbox"
          checked={allLoadedSelected}
          onChange={toggleAllLoaded}
          className="accent-[#c4f54a] w-3.5 h-3.5"
        />
        <span className="flex-1">Contact</span>
        <span className="w-32 hidden md:block">Phone</span>
        <span className="w-40 hidden lg:block">Company</span>
        {showStage && <span className="w-28">Stage</span>}
        <span className="w-32 hidden xl:block">Tags</span>
      </div>

      <div ref={parentRef} onScroll={onScroll} className="max-h-[60vh] overflow-y-auto">
        {results.length === 0 && status !== "LoadingFirstPage" && (
          <div className="text-center py-16 text-white/30 text-xs">
            No contacts match this view.
          </div>
        )}
        {status === "LoadingFirstPage" && (
          <div className="text-center py-16 text-white/30 text-xs">Loading…</div>
        )}
        <div
          style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
        >
          {rowVirtualizer.getVirtualItems().map((vi) => {
            const c = results[vi.index]
            const stage = c.stageId ? stageMap.get(c.stageId) : undefined
            return (
              <div
                key={c._id}
                className="absolute left-0 right-0 flex items-center gap-3 px-4 border-t border-white/5 hover:bg-white/[0.02] cursor-pointer text-sm"
                style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}
                onClick={() => onOpenContact(c._id)}
              >
                <input
                  type="checkbox"
                  checked={isRowSelected(selection, c._id)}
                  onChange={() => setSelection(toggleRow(selection, c._id))}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-[#c4f54a] w-3.5 h-3.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {contactDisplayName(c)}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {c.email ?? c.company ?? ""}
                  </div>
                </div>
                <div className="w-32 hidden md:block text-white/70 truncate">
                  {c.phone ?? "—"}
                </div>
                <div className="w-40 hidden lg:block text-white/70 truncate">
                  {c.company ?? "—"}
                </div>
                {showStage && (
                  <div className="w-28">
                    {stage && (
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] rounded-full px-2 py-0.5"
                        style={{
                          background: `${stage.color}22`,
                          color: stage.color,
                        }}
                      >
                        {stage.name}
                      </span>
                    )}
                  </div>
                )}
                <div className="w-32 hidden xl:flex gap-1 flex-wrap">
                  {(c.tags ?? []).slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] rounded-full bg-white/10 text-white/60 px-1.5 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {status === "LoadingMore" && (
          <div className="text-center py-3 text-white/30 text-xs">Loading more…</div>
        )}
      </div>
    </div>
  )
}

function BulkBar({
  count,
  selection,
  loadedCount,
  knownTotal,
  onSelectAllMatching,
  onClear,
  campaignId,
  stages,
  filterArgs,
  results,
}: {
  count: number
  selection: Selection
  loadedCount: number
  knownTotal: number | undefined
  onSelectAllMatching: () => void
  onClear: () => void
  campaignId: Id<"campaigns"> | null
  stages: Array<Doc<"stages">> | undefined
  filterArgs: Record<string, unknown>
  results: Array<ContactRow>
}) {
  const startBulk = useAction(api.crmBulk.startBulk)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<null | "tag" | "delete">(null)

  const selectionArg = () =>
    selection.mode === "all"
      ? { filter: filterArgs }
      : { ids: [...(selection.mode === "ids" ? selection.ids : [])] as Array<Id<"contacts">> }

  const run = async (action: Record<string, unknown>) => {
    setBusy(true)
    try {
      await startBulk({ action, selection: selectionArg() } as never)
      onClear()
    } finally {
      setBusy(false)
    }
  }

  const canOfferAll =
    selection.mode === "ids" &&
    knownTotal !== undefined &&
    knownTotal > loadedCount &&
    count >= loadedCount

  const exportCsv = () => {
    const rows =
      selection.mode === "ids"
        ? results.filter((r) => (selection.ids as ReadonlySet<string>).has(r._id))
        : results
    const blob = new Blob([contactsToCsv(rows)], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contacts.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="sticky bottom-4 mt-4 z-30">
      <div className="mx-auto max-w-3xl rounded-2xl bg-[#1a1a1c] border border-[#c4f54a]/30 shadow-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-[#c4f54a]">
          {count.toLocaleString()} selected
        </span>
        {canOfferAll && (
          <button
            onClick={onSelectAllMatching}
            className="text-xs text-white/70 underline hover:text-white"
          >
            Select all {knownTotal?.toLocaleString()} matching
          </button>
        )}
        <div className="flex-1" />
        {campaignId && stages && (
          <select
            disabled={busy}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value)
                run({
                  kind: "setStage",
                  campaignId,
                  stageId: e.target.value as Id<"stages">,
                })
            }}
            className="bg-[#101012] border border-white/10 rounded-full text-xs text-white px-3 py-1.5"
          >
            <option value="" disabled>
              Move to stage…
            </option>
            {stages.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <BulkButton
          icon={<Tag size={13} />}
          label="Tag"
          disabled={busy}
          onClick={() => setDialog("tag")}
        />
        <BulkButton
          icon={<Download size={13} />}
          label="Export"
          disabled={busy}
          onClick={exportCsv}
        />
        <BulkButton
          icon={<Trash2 size={13} />}
          label="Delete"
          danger
          disabled={busy}
          onClick={() => setDialog("delete")}
        />
        <button
          onClick={onClear}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"
        >
          <X size={13} />
        </button>
      </div>

      {dialog === "tag" && (
        <PromptDialog
          title="Add a tag"
          label={`Tag for ${count.toLocaleString()} contact${count === 1 ? "" : "s"}`}
          placeholder="vip"
          submitLabel="Add tag"
          onSubmit={(tag) => {
            setDialog(null)
            void run({ kind: "addTag", tag })
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete contacts?"
          message={`This permanently deletes ${count.toLocaleString()} contact${count === 1 ? "" : "s"} everywhere.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => void run({ kind: "delete" })}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

function BulkButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
        danger
          ? "text-red-300 hover:bg-red-500/15 border border-red-500/20"
          : "text-white/70 hover:bg-white/10 border border-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
