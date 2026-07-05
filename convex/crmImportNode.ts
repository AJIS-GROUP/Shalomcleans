"use node"

import { internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import * as XLSX from "xlsx"
import { columnMapping, mapRows } from "./crmImport"

const CHUNK_SIZE = 500
// Guardrail well above the ~10k expected per import: keeps a runaway file from
// OOM-ing or timing out the Node action (which would strand the job "running").
const MAX_ROWS = 20_000

/**
 * Parse a stored CSV/XLS/XLSX file and import its rows into a campaign. Runs in
 * the Node runtime (SheetJS). Server-side re-parse is authoritative — the client
 * preview is never trusted. Progress and outcome are written to the importJob so
 * the UI can subscribe live.
 */
export const _runImport = internalAction({
  args: {
    jobId: v.id("importJobs"),
    storageId: v.id("_storage"),
    mapping: columnMapping,
  },
  handler: async (ctx, { jobId, storageId, mapping }) => {
    // Claim atomically: flips pending→running and returns the job's campaign.
    // A second run for the same job gets null here and no-ops (idempotent).
    const claim = await ctx.runMutation(internal.crmImport._claimJob, { jobId })
    if (!claim) return
    const { campaignId } = claim

    try {
      const stageId = await ctx.runQuery(internal.crmImport._firstStageId, {
        campaignId,
      })
      if (!stageId) throw new Error("Campaign has no stages to import into")

      const blob = await ctx.storage.get(storageId)
      if (!blob) throw new Error("Uploaded file not found")

      const bytes = new Uint8Array(await blob.arrayBuffer())
      const workbook = XLSX.read(bytes, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new Error("File has no sheets")

      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      })
      if (parsed.length > MAX_ROWS) {
        throw new Error(
          `File has ${parsed.length} rows; the ${MAX_ROWS}-row limit was exceeded`,
        )
      }
      const rows = mapRows(parsed, mapping)

      await ctx.runMutation(internal.crmImport._setJobTotal, {
        jobId,
        total: rows.length,
      })

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        await ctx.runMutation(internal.crm.importChunk, {
          campaignId,
          stageId,
          jobId,
          rows: rows.slice(i, i + CHUNK_SIZE),
        })
      }

      await ctx.runMutation(internal.crmImport._setJobStatus, {
        jobId,
        status: "done",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await ctx.runMutation(internal.crmImport._setJobError, {
        jobId,
        error: message.slice(0, 500),
      })
    } finally {
      // The raw upload is never needed after a claimed run, success or failure.
      await ctx.storage.delete(storageId)
    }
  },
})
