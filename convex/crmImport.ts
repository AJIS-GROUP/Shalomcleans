import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"
import { internal } from "./_generated/api"
import { v, type Infer } from "convex/values"
import { requireAdmin } from "./auth"
import { jobStatus } from "./schema"
import type { ImportRow } from "./crm"

// ---- Column mapping ----

export const columnTarget = v.union(
  v.literal("name"),
  v.literal("email"),
  v.literal("phone"),
  v.literal("company"),
  v.literal("title"),
  v.literal("custom"),
  v.literal("ignore"),
)

export const columnMapping = v.array(
  v.object({ header: v.string(), target: columnTarget }),
)
export type ColumnMapping = Infer<typeof columnMapping>

const CORE_TARGETS = new Set(["name", "email", "phone", "company", "title"])

/**
 * Turn raw sheet rows (objects keyed by header) into ImportRows using the
 * operator's column mapping. Core headers become fields, "custom" headers become
 * {key,value} pairs (sanitised later, on insert), everything else is dropped.
 * Empty cells are omitted so we never emit blank fields.
 */
export function mapRows(
  rows: Array<Record<string, unknown>>,
  mapping: ColumnMapping,
): ImportRow[] {
  return rows.map((row) => {
    const out: ImportRow = {}
    const custom: Array<{ key: string; value: string }> = []
    const filledCore = new Set<string>()
    for (const { header, target } of mapping) {
      if (target === "ignore") continue
      const raw = row[header]
      const value = (raw == null ? "" : String(raw)).trim()
      if (!value) continue
      // A second column aimed at an already-filled core field is demoted to a
      // custom pair so its data is preserved rather than silently clobbered.
      if (target === "custom" || filledCore.has(target)) {
        custom.push({ key: header, value })
      } else if (CORE_TARGETS.has(target)) {
        ;(out as Record<string, string>)[target] = value
        filledCore.add(target)
      }
    }
    if (custom.length > 0) out.custom = custom
    return out
  })
}

// ---- Upload + job lifecycle (client-facing, admin-gated) ----

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const createImportJob = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }) => {
    await requireAdmin(ctx)
    return await ctx.db.insert("importJobs", {
      kind: "import",
      campaignId,
      status: "pending",
      total: 0,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      invalid: 0,
    })
  },
})

export const getImportJob = query({
  args: { jobId: v.id("importJobs") },
  handler: async (ctx, { jobId }) => {
    await requireAdmin(ctx)
    return await ctx.db.get(jobId)
  },
})

/**
 * Kick off an import. Returns immediately; the heavy parse/insert runs in a
 * scheduled Node action so the client can subscribe to the job for progress.
 */
export const importFromStorage = action({
  args: {
    jobId: v.id("importJobs"),
    storageId: v.id("_storage"),
    mapping: columnMapping,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    // campaignId is not accepted here — it's read from the job when claimed, so
    // the target campaign can't drift from what the job records.
    await ctx.scheduler.runAfter(0, internal.crmImportNode._runImport, args)
  },
})

// ---- Internal helpers used by the parsing action ----

export const _firstStageId = internalQuery({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }) => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect()
    stages.sort((a, b) => a.order - b.order)
    return stages[0]?._id ?? null
  },
})

/**
 * Atomically claim a pending job for running and hand back its campaign. Returns
 * null if the job is missing or not pending — which makes the import idempotent:
 * a second invocation for the same job simply no-ops instead of double-counting.
 */
export const _claimJob = internalMutation({
  args: { jobId: v.id("importJobs") },
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId)
    if (!job || job.status !== "pending" || !job.campaignId) return null
    await ctx.db.patch(jobId, { status: "running" })
    return { campaignId: job.campaignId }
  },
})

export const _setJobStatus = internalMutation({
  args: { jobId: v.id("importJobs"), status: jobStatus },
  handler: async (ctx, { jobId, status }) => {
    await ctx.db.patch(jobId, { status })
  },
})

export const _setJobTotal = internalMutation({
  args: { jobId: v.id("importJobs"), total: v.number() },
  handler: async (ctx, { jobId, total }) => {
    await ctx.db.patch(jobId, { total })
  },
})

export const _setJobError = internalMutation({
  args: { jobId: v.id("importJobs"), error: v.string() },
  handler: async (ctx, { jobId, error }) => {
    await ctx.db.patch(jobId, { status: "error", error })
  },
})
