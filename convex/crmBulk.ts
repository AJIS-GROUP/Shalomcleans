import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server"
import { internal } from "./_generated/api"
import { v, type Infer } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { requireAdmin } from "./auth"
import { type WriteCtx } from "./crm"
import {
  addContactToCampaignImpl,
  addTagImpl,
  deleteContactImpl,
  moveStageImpl,
  removeTagImpl,
} from "./crmMutations"
import { listContactsImpl } from "./crmQueries"

// ---- Action + selection shapes ----

// A flat object (not a 5-way union of objects): keeps the generated `api` type
// small enough that TypeScript doesn't widen unrelated query refs to `any`.
// Field presence per kind is enforced at runtime in applyBulkChunkImpl.
export const bulkAction = v.object({
  kind: v.union(
    v.literal("setStage"),
    v.literal("addTag"),
    v.literal("removeTag"),
    v.literal("delete"),
    v.literal("addToCampaign"),
  ),
  campaignId: v.optional(v.id("campaigns")),
  stageId: v.optional(v.id("stages")),
  tag: v.optional(v.string()),
})
export type BulkAction = Infer<typeof bulkAction>

const contactFilter = v.object({
  campaignId: v.optional(v.id("campaigns")),
  stageId: v.optional(v.id("stages")),
  search: v.optional(v.string()),
  hasEmail: v.optional(v.boolean()),
  hasPhone: v.optional(v.boolean()),
  tag: v.optional(v.string()),
})

const selection = v.object({
  ids: v.optional(v.array(v.id("contacts"))),
  filter: v.optional(contactFilter),
})

const CHUNK_SIZE = 500
const ENUMERATE_PAGE = 500
// Safety ceiling on a single bulk op (matches the ~50k store target).
const MAX_TARGETS = 50_000

/**
 * Apply one bulk action to a chunk of contacts, reusing the Phase-4 impls so
 * counts and activity logging stay identical to the single-item paths.
 */
export async function applyBulkChunkImpl(
  ctx: WriteCtx,
  args: { action: BulkAction; contactIds: Array<Id<"contacts">>; by?: string },
): Promise<void> {
  const { action, contactIds, by } = args
  for (const contactId of contactIds) {
    switch (action.kind) {
      case "addTag":
        if (action.tag) await addTagImpl(ctx, { contactId, tag: action.tag, by })
        break
      case "removeTag":
        if (action.tag) await removeTagImpl(ctx, { contactId, tag: action.tag })
        break
      case "delete":
        await deleteContactImpl(ctx, { contactId })
        break
      case "addToCampaign":
        if (action.campaignId) {
          await addContactToCampaignImpl(ctx, {
            contactId,
            campaignId: action.campaignId,
            by,
          })
        }
        break
      case "setStage": {
        if (!action.campaignId || !action.stageId) break
        const campaignId = action.campaignId
        const m = await ctx.db
          .query("memberships")
          .withIndex("by_contact_campaign", (q) =>
            q.eq("contactId", contactId).eq("campaignId", campaignId),
          )
          .first()
        if (m) {
          await moveStageImpl(ctx, {
            membershipId: m._id,
            stageId: action.stageId,
            by,
          })
        }
        break
      }
    }
  }
}

export { addContactToCampaignImpl }

// ---- Internal plumbing ----

export const _claimBulkJob = internalMutation({
  args: { jobId: v.id("importJobs") },
  handler: async (ctx, { jobId }): Promise<boolean> => {
    const job = await ctx.db.get(jobId)
    if (!job || job.status !== "pending") return false
    await ctx.db.patch(jobId, { status: "running" })
    return true
  },
})

type EnumeratePage = {
  ids: Array<Id<"contacts">>
  continueCursor: string
  isDone: boolean
}

export const _enumerateContacts = internalQuery({
  args: {
    filter: contactFilter,
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { filter, cursor }): Promise<EnumeratePage> => {
    const result = await listContactsImpl(ctx, {
      ...filter,
      paginationOpts: { numItems: ENUMERATE_PAGE, cursor },
    })
    return {
      ids: result.page.map((r) => r._id),
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    }
  },
})

export const _bulkChunk = internalMutation({
  args: {
    jobId: v.id("importJobs"),
    action: bulkAction,
    contactIds: v.array(v.id("contacts")),
    by: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, action, contactIds, by }): Promise<void> => {
    await applyBulkChunkImpl(ctx, { action, contactIds, by })
    const job = await ctx.db.get(jobId)
    if (job) {
      await ctx.db.patch(jobId, { processed: job.processed + contactIds.length })
    }
  },
})

/**
 * Run a bulk action over an explicit id list or an entire filter. The filter set
 * is enumerated to ids FIRST (read-only) so mutating rows can't corrupt cursor
 * pagination, then applied in chunks with live job progress.
 */
export const _runBulk = internalAction({
  args: {
    jobId: v.id("importJobs"),
    action: bulkAction,
    selection,
    by: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, action, selection: sel, by }): Promise<void> => {
    const claimed = await ctx.runMutation(internal.crmBulk._claimBulkJob, {
      jobId,
    })
    if (!claimed) return

    try {
      const targets: Array<Id<"contacts">> = []
      if (sel.ids) {
        // Cap an explicit id list to the same ceiling as filter enumeration.
        targets.push(...sel.ids.slice(0, MAX_TARGETS))
      } else if (sel.filter) {
        let cursor: string | null = null
        while (targets.length < MAX_TARGETS) {
          const page: EnumeratePage = await ctx.runQuery(
            internal.crmBulk._enumerateContacts,
            { filter: sel.filter, cursor },
          )
          targets.push(...page.ids)
          if (page.isDone) break
          cursor = page.continueCursor
        }
      }

      await ctx.runMutation(internal.crmImport._setJobTotal, {
        jobId,
        total: targets.length,
      })

      for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        await ctx.runMutation(internal.crmBulk._bulkChunk, {
          jobId,
          action,
          contactIds: targets.slice(i, i + CHUNK_SIZE),
          by,
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
    }
  },
})

// ---- Public, admin-gated entrypoint ----

export const startBulk = action({
  args: { action: bulkAction, selection },
  handler: async (ctx, args): Promise<Id<"importJobs">> => {
    const user = await requireAdmin(ctx)
    const jobId = await ctx.runMutation(internal.crmBulk._createBulkJob, {
      action: args.action.kind,
    })
    await ctx.scheduler.runAfter(0, internal.crmBulk._runBulk, {
      ...args,
      jobId,
      by: user.email ?? undefined,
    })
    return jobId
  },
})

export const _createBulkJob = internalMutation({
  args: { action: v.string() },
  handler: async (ctx, { action }): Promise<Id<"importJobs">> => {
    return await ctx.db.insert("importJobs", {
      kind: "bulk",
      action,
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
