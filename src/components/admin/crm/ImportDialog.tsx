import { useMemo, useState } from "react"
import { useAction, useMutation, useQuery } from "convex/react"
import { UploadCloud, X, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { suggestMapping, type ColumnMapping, type ColumnTarget } from "#/lib/crm/mapping"

const TARGET_OPTIONS: Array<{ value: ColumnTarget; label: string }> = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "title", label: "Title" },
  { value: "custom", label: "Custom field" },
  { value: "ignore", label: "Ignore" },
]

type Parsed = {
  file: File
  headers: Array<string>
  preview: Array<Record<string, string>>
}

export function ImportDialog({
  campaignId,
  campaignName,
  onClose,
}: {
  campaignId: Id<"campaigns">
  campaignName: string
  onClose: () => void
}) {
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>([])
  const [jobId, setJobId] = useState<Id<"importJobs"> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const generateUploadUrl = useMutation(api.crmImport.generateUploadUrl)
  const createImportJob = useMutation(api.crmImport.createImportJob)
  const importFromStorage = useAction(api.crmImport.importFromStorage)
  const job = useQuery(api.crmImport.getImportJob, jobId ? { jobId } : "skip")

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const XLSX = await import("xlsx")
      const bytes = new Uint8Array(await file.arrayBuffer())
      const wb = XLSX.read(bytes, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: "",
        raw: false,
      })
      const headers = rows.length
        ? Object.keys(rows[0])
        : (XLSX.utils.sheet_to_json<Array<string>>(sheet, { header: 1 })[0] ?? [])
      if (headers.length === 0) {
        setError("Couldn't find any columns in that file.")
        return
      }
      setParsed({ file, headers, preview: rows.slice(0, 5) })
      setMapping(suggestMapping(headers))
    } catch {
      setError("Couldn't read that file. Supported: CSV, XLS, XLSX.")
    }
  }

  const startImport = async () => {
    if (!parsed) return
    setUploading(true)
    setError(null)
    try {
      const postUrl = await generateUploadUrl()
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": parsed.file.type || "application/octet-stream" },
        body: parsed.file,
      })
      if (!res.ok) throw new Error("Upload failed")
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
      const newJobId = await createImportJob({ campaignId })
      setJobId(newJobId)
      await importFromStorage({ jobId: newJobId, storageId, mapping })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed to start.")
    } finally {
      setUploading(false)
    }
  }

  const setTarget = (index: number, target: ColumnTarget) =>
    setMapping((m) => m.map((c, i) => (i === index ? { ...c, target } : c)))

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1a1c] border border-white/10 rounded-3xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-xl">Import into {campaignName}</h2>
            <p className="text-xs text-white/40 mt-1">
              CSV, XLS, or XLSX. Duplicate emails merge automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {jobId ? (
          <ImportProgress job={job} onClose={onClose} />
        ) : parsed ? (
          <MappingStep
            parsed={parsed}
            mapping={mapping}
            onTarget={setTarget}
            onBack={() => setParsed(null)}
            onImport={startImport}
            uploading={uploading}
          />
        ) : (
          <Dropzone onFile={handleFile} />
        )}
      </div>
    </div>
  )
}

function Dropzone({ onFile }: { onFile: (file: File | undefined) => void }) {
  const [over, setOver] = useState(false)
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onFile(e.dataTransfer.files[0])
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-16 cursor-pointer transition-colors ${
        over ? "border-[#c4f54a] bg-[#c4f54a]/5" : "border-white/10 hover:border-white/20"
      }`}
    >
      <UploadCloud size={32} className="text-white/40" />
      <div className="text-sm text-white/70">Drop a file or click to browse</div>
      <div className="text-[11px] text-white/30">
        Google Sheets: File → Download → CSV
      </div>
      <input
        type="file"
        accept=".csv,.xls,.xlsx,text/csv"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </label>
  )
}

function MappingStep({
  parsed,
  mapping,
  onTarget,
  onBack,
  onImport,
  uploading,
}: {
  parsed: Parsed
  mapping: ColumnMapping
  onTarget: (index: number, target: ColumnTarget) => void
  onBack: () => void
  onImport: () => void
  uploading: boolean
}) {
  const hasEmail = useMemo(
    () => mapping.some((c) => c.target === "email"),
    [mapping],
  )
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
        <FileSpreadsheet size={14} /> {parsed.file.name} · {parsed.headers.length}{" "}
        columns · {parsed.preview.length > 0 ? "preview below" : "no rows"}
      </div>
      <p className="text-[11px] text-white/40 mb-4">
        We guessed how each column maps. Set anything wrong — pick a field, or{" "}
        <span className="text-white/60">Custom field</span> to keep extra data,
        or <span className="text-white/60">Ignore</span> to drop it. Each row
        needs an <span className="text-white/60">Email</span> or{" "}
        <span className="text-white/60">Phone</span> to import.
      </p>

      <div className="grid grid-cols-[1fr_auto] gap-2 px-3 mb-1 text-[9px] uppercase tracking-wide text-white/30">
        <span>Your column · sample</span>
        <span>Maps to</span>
      </div>
      <div className="space-y-1.5 mb-4">
        {mapping.map((col, i) => (
          <div
            key={col.header}
            className="flex items-center gap-3 bg-[#101012] border border-white/5 rounded-xl px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{col.header}</div>
              <div className="text-[10px] text-white/30 truncate">
                {parsed.preview
                  .map((r) => r[col.header])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(", ") || "—"}
              </div>
            </div>
            <select
              value={col.target}
              onChange={(e) => onTarget(i, e.target.value as ColumnTarget)}
              className="bg-[#0e0e0f] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5"
            >
              {TARGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!hasEmail && (
        <div className="mb-3 text-[11px] text-amber-400">
          No column is mapped to Email — rows without an email or phone are
          skipped.
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-white/50 hover:text-white"
        >
          ← Choose a different file
        </button>
        <button
          onClick={onImport}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full bg-[#c4f54a] text-black text-xs font-semibold px-5 py-2.5 hover:bg-[#d4ff5a] active:scale-95 transition disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Import contacts"}
        </button>
      </div>
    </div>
  )
}

function ImportProgress({
  job,
  onClose,
}: {
  job:
    | {
        status: string
        total: number
        processed: number
        inserted: number
        updated: number
        skipped: number
        invalid: number
        error?: string
      }
    | null
    | undefined
  onClose: () => void
}) {
  if (!job) {
    return <div className="py-10 text-center text-white/40 text-sm">Starting…</div>
  }

  if (job.status === "error") {
    return (
      <div className="py-8 text-center">
        <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
        <div className="text-sm text-white/80">Import failed</div>
        <div className="text-xs text-red-400 mt-1">{job.error}</div>
        <button
          onClick={onClose}
          className="mt-5 rounded-full border border-white/10 text-xs text-white/70 px-4 py-2 hover:bg-white/5"
        >
          Close
        </button>
      </div>
    )
  }

  const done = job.status === "done"
  const pct =
    job.total > 0 ? Math.round((job.processed / job.total) * 100) : done ? 100 : 0

  return (
    <div className="py-6">
      {done ? (
        <CheckCircle2 size={28} className="text-[#c4f54a] mx-auto mb-3" />
      ) : (
        <div className="text-center text-sm text-white/70 mb-3">
          Importing… {job.processed.toLocaleString()} / {job.total.toLocaleString()}
        </div>
      )}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
        <div
          className="h-full bg-[#c4f54a] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {done && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center mb-5">
            <Stat label="New" value={job.inserted} />
            <Stat label="Merged" value={job.updated} />
            <Stat label="Duplicates" value={job.skipped} />
            <Stat label="Invalid" value={job.invalid} />
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#c4f54a] text-black text-xs font-semibold py-2.5 hover:bg-[#d4ff5a] transition"
          >
            Done
          </button>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#101012] border border-white/5 py-3">
      <div className="text-lg font-display text-white">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/40">
        {label}
      </div>
    </div>
  )
}
