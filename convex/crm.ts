import { internalMutation } from "./_generated/server"
import type { Doc, Id, DataModel } from "./_generated/dataModel"
import { v, type Infer } from "convex/values"
import type { GenericDatabaseWriter } from "convex/server"

/** Minimal writable ctx — lets helpers run under both real mutations and tests. */
export type WriteCtx = { db: GenericDatabaseWriter<DataModel> }
import { activityType } from "./schema"

type ActivityKind = Infer<typeof activityType>

// ---- Normalisation helpers (pure, exported for reuse) ----

/** Lowercased email, but only if it looks like one (must contain "@"). */
export function normalizeEmail(email?: string): string | undefined {
  const e = email?.trim().toLowerCase()
  return e && e.includes("@") ? e : undefined
}

/**
 * Canonical US phone key: digits only, dropping a leading country-code "1", and
 * only accepted when exactly 10 digits remain. Rejecting shorter numbers avoids
 * ambiguous 7-digit locals colliding across unrelated people; dropping the "1"
 * lets "+1 555…" merge with "555…".
 */
export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined
  let digits = phone.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1)
  return digits.length === 10 ? digits : undefined
}

/**
 * Coerce an imported column name into a legal Convex record key (printable
 * ASCII, non-empty, not starting with "$" or "_"). Returns undefined if nothing
 * usable remains, so a stray header can't abort the whole import chunk.
 */
export function sanitizeCustomKey(key: string): string | undefined {
  const ascii = key.replace(/[^\x20-\x7E]/g, "").trim()
  const cleaned = ascii.replace(/^[$_]+/, "").trim()
  return cleaned.length > 0 ? cleaned : undefined
}

/**
 * Build a sanitized custom-field bag from raw {key,value} pairs, dropping empty
 * values and illegal keys. Custom arrives as pairs (not a record) precisely so a
 * header that isn't a legal Convex record key can't fail argument validation on
 * the wire and abort the whole chunk.
 */
function sanitizeCustom(
  raw?: Array<{ key: string; value: string }>,
): Record<string, string> | undefined {
  if (!raw) return undefined
  const out: Record<string, string> = {}
  for (const { key: rawKey, value } of raw) {
    if (!value) continue
    const key = sanitizeCustomKey(rawKey)
    if (key && out[key] === undefined) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function buildSearchText(c: {
  name?: string
  email?: string
  company?: string
  title?: string
}): string {
  return [c.name, c.email, c.company, c.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

const importRow = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  company: v.optional(v.string()),
  title: v.optional(v.string()),
  // Pairs, not a record: raw import headers may not be legal record keys, and a
  // record validator would reject the whole chunk before we could sanitize.
  custom: v.optional(
    v.array(v.object({ key: v.string(), value: v.string() })),
  ),
})

export type ImportRow = Infer<typeof importRow>

type Outcome = "inserted" | "updated" | "skipped" | "invalid"

/** True-ish (returns the doc) if any contact already holds this dedupe key. */
async function keyOwner(
  ctx: WriteCtx,
  index: "by_email" | "by_phone",
  field: "emailKey" | "phoneKey",
  key: string,
): Promise<Doc<"contacts"> | null> {
  return await ctx.db
    .query("contacts")
    .withIndex(index, (q) => q.eq(field, key))
    .first()
}

export async function logActivity(
  ctx: WriteCtx,
  args: {
    contactId: Id<"contacts">
    campaignId?: Id<"campaigns">
    type: ActivityKind
    body?: string
    meta?: unknown
    by?: string
  },
) {
  await ctx.db.insert("activities", {
    contactId: args.contactId,
    campaignId: args.campaignId,
    type: args.type,
    body: args.body,
    meta: args.meta,
    at: Date.now(),
    by: args.by,
  })
}

/**
 * Upsert a single imported row into the global contact pool and link it to a
 * campaign. Dedupe key is lowercased email, falling back to a digits-only phone.
 * Existing contacts keep their values — only blank fields are filled.
 */
async function upsertRow(
  ctx: WriteCtx,
  opts: {
    campaignId: Id<"campaigns">
    stageId: Id<"stages">
    by?: string
    row: ImportRow
  },
): Promise<Outcome> {
  const { campaignId, stageId, by, row } = opts
  const emailKey = normalizeEmail(row.email)
  const phoneKey = normalizePhone(row.phone)
  const name = row.name?.trim() || undefined

  // No email and no phone → uncontactable and impossible to dedupe. A name
  // alone would silently duplicate on every re-import, so reject the row.
  if (!emailKey && !phoneKey) return "invalid"

  let existing: Doc<"contacts"> | null = null
  if (emailKey) {
    existing = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("emailKey", emailKey))
      .first()
  }
  if (!existing && phoneKey) {
    existing = await ctx.db
      .query("contacts")
      .withIndex("by_phone", (q) => q.eq("phoneKey", phoneKey))
      .first()
  }

  let contactId: Id<"contacts">
  let isNewContact = false

  if (existing) {
    contactId = existing._id
    const patch: Partial<Doc<"contacts">> = {}
    if (!existing.name && name) patch.name = name
    if (!existing.company && row.company?.trim()) patch.company = row.company.trim()
    if (!existing.title && row.title?.trim()) patch.title = row.title.trim()
    // Only backfill a dedupe key if no OTHER contact already owns it, otherwise
    // we would create two contacts sharing the same key (a silent duplicate).
    if (!existing.emailKey && emailKey && !(await keyOwner(ctx, "by_email", "emailKey", emailKey))) {
      patch.email = row.email!.trim()
      patch.emailKey = emailKey
      patch.hasEmail = true
    }
    if (!existing.phoneKey && phoneKey && !(await keyOwner(ctx, "by_phone", "phoneKey", phoneKey))) {
      patch.phone = row.phone!.trim()
      patch.phoneKey = phoneKey
      patch.hasPhone = true
    }
    const incomingCustom = sanitizeCustom(row.custom)
    if (incomingCustom) {
      const merged = { ...(existing.custom ?? {}) }
      let changed = false
      for (const [k, val] of Object.entries(incomingCustom)) {
        if (merged[k] === undefined) {
          merged[k] = val
          changed = true
        }
      }
      if (changed) patch.custom = merged
    }
    if (
      patch.name !== undefined ||
      patch.email !== undefined ||
      patch.company !== undefined ||
      patch.title !== undefined
    ) {
      patch.searchText = buildSearchText({
        name: patch.name ?? existing.name,
        email: patch.email ?? existing.email,
        company: patch.company ?? existing.company,
        title: patch.title ?? existing.title,
      })
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch(contactId, patch)
  } else {
    isNewContact = true
    contactId = await ctx.db.insert("contacts", {
      name,
      email: emailKey ? row.email!.trim() : undefined,
      phone: phoneKey ? row.phone!.trim() : undefined,
      company: row.company?.trim() || undefined,
      title: row.title?.trim() || undefined,
      emailKey,
      phoneKey,
      searchText: buildSearchText({
        name,
        email: emailKey,
        company: row.company,
        title: row.title,
      }),
      custom: sanitizeCustom(row.custom),
      tags: [],
      hasEmail: !!emailKey,
      hasPhone: !!phoneKey,
    })
    await logActivity(ctx, { contactId, campaignId, type: "created", by })
  }

  // Dedupe the membership: a contact can only be in a campaign once.
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_contact_campaign", (q) =>
      q.eq("contactId", contactId).eq("campaignId", campaignId),
    )
    .first()
  if (membership) return "skipped"

  await ctx.db.insert("memberships", {
    contactId,
    campaignId,
    stageId,
    addedAt: Date.now(),
  })
  await logActivity(ctx, { contactId, campaignId, type: "import", by })
  return isNewContact ? "inserted" : "updated"
}

/**
 * Import a batch of rows into a campaign. Called repeatedly (chunked) by the
 * import action so no single mutation blows past Convex limits. When jobId is
 * given, live progress is written for the UI to subscribe to.
 */
export const importChunk = internalMutation({
  args: {
    campaignId: v.id("campaigns"),
    stageId: v.id("stages"),
    by: v.optional(v.string()),
    jobId: v.optional(v.id("importJobs")),
    rows: v.array(importRow),
  },
  handler: async (ctx, { campaignId, stageId, by, jobId, rows }) => {
    let inserted = 0
    let updated = 0
    let skipped = 0
    let invalid = 0
    for (const row of rows) {
      const outcome = await upsertRow(ctx, { campaignId, stageId, by, row })
      if (outcome === "inserted") inserted++
      else if (outcome === "updated") updated++
      else if (outcome === "skipped") skipped++
      else invalid++
    }

    if (jobId) {
      const job = await ctx.db.get(jobId)
      if (job) {
        await ctx.db.patch(jobId, {
          processed: job.processed + rows.length,
          inserted: job.inserted + inserted,
          updated: job.updated + updated,
          skipped: job.skipped + skipped,
          invalid: job.invalid + invalid,
        })
      }
    }

    // Each inserted/updated row added a fresh membership at this stage.
    const newMembers = inserted + updated
    if (newMembers > 0) {
      const camp = await ctx.db.get(campaignId)
      if (camp) {
        await ctx.db.patch(campaignId, {
          contactCount: camp.contactCount + newMembers,
        })
      }
      const stage = await ctx.db.get(stageId)
      if (stage) {
        await ctx.db.patch(stageId, {
          count: (stage.count ?? 0) + newMembers,
        })
      }
    }

    return { inserted, updated, skipped, invalid }
  },
})
