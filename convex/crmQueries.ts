import { query } from "./_generated/server"
import { v } from "convex/values"
import {
  paginationOptsValidator,
  type GenericDatabaseReader,
  type PaginationOptions,
  type PaginationResult,
} from "convex/server"
import type { DataModel, Doc, Id } from "./_generated/dataModel"
import { requireAdmin } from "./auth"

// Auth-free read seam. Public queries add requireAdmin and delegate here; tests
// exercise the impls directly (the better-auth component can't be seeded in
// convex-test).
type ReadCtx = { db: GenericDatabaseReader<DataModel> }

export type ContactRow = Doc<"contacts"> & {
  membershipId?: Id<"memberships">
  stageId?: Id<"stages">
  addedAt?: number
}

function matchesFilters(
  c: Doc<"contacts">,
  f: { search?: string; hasEmail?: boolean; hasPhone?: boolean; tag?: string },
): boolean {
  if (f.hasEmail !== undefined && c.hasEmail !== f.hasEmail) return false
  if (f.hasPhone !== undefined && c.hasPhone !== f.hasPhone) return false
  if (f.tag && !(c.tags ?? []).includes(f.tag)) return false
  if (f.search && f.search.trim()) {
    if (!c.searchText.includes(f.search.trim().toLowerCase())) return false
  }
  return true
}

export type ContactFilters = {
  campaignId?: Id<"campaigns">
  stageId?: Id<"stages">
  search?: string
  hasEmail?: boolean
  hasPhone?: boolean
  tag?: string
}

/**
 * Paginated contact list. When scoped to a campaign we page through its
 * memberships (indexed by campaign[/stage]) and join contacts, applying
 * search/facet filters within the page. Globally we use the full-text search
 * index when searching, else page contacts newest-first.
 */
export async function listContactsImpl(
  ctx: ReadCtx,
  args: ContactFilters & { paginationOpts: PaginationOptions },
): Promise<PaginationResult<ContactRow>> {
  const { campaignId, stageId, search, hasEmail, hasPhone, tag, paginationOpts } =
    args

  if (campaignId) {
    const memberships = stageId
      ? ctx.db
          .query("memberships")
          .withIndex("by_campaign_stage", (q) =>
            q.eq("campaignId", campaignId).eq("stageId", stageId),
          )
      : ctx.db
          .query("memberships")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
    const result = await memberships.order("desc").paginate(paginationOpts)
    const page: ContactRow[] = []
    for (const m of result.page) {
      const c = await ctx.db.get(m.contactId)
      if (!c) continue
      if (!matchesFilters(c, { search, hasEmail, hasPhone, tag })) continue
      page.push({
        ...c,
        membershipId: m._id,
        stageId: m.stageId,
        addedAt: m.addedAt,
      })
    }
    return { ...result, page }
  }

  if (search && search.trim()) {
    const term = search.trim()
    const result = await ctx.db
      .query("contacts")
      .withSearchIndex("search_text", (q) => {
        let s = q.search("searchText", term)
        if (hasEmail !== undefined) s = s.eq("hasEmail", hasEmail)
        if (hasPhone !== undefined) s = s.eq("hasPhone", hasPhone)
        return s
      })
      .paginate(paginationOpts)
    const page = result.page.filter((c) =>
      tag ? (c.tags ?? []).includes(tag) : true,
    )
    return { ...result, page }
  }

  const ordered = ctx.db.query("contacts").order("desc")
  const filtered =
    hasEmail === undefined && hasPhone === undefined
      ? ordered
      : ordered.filter((q) => {
          const conds = []
          if (hasEmail !== undefined)
            conds.push(q.eq(q.field("hasEmail"), hasEmail))
          if (hasPhone !== undefined)
            conds.push(q.eq(q.field("hasPhone"), hasPhone))
          return conds.length === 1 ? conds[0] : q.and(...conds)
        })
  const result = await filtered.paginate(paginationOpts)
  const page = result.page.filter((c) =>
    tag ? (c.tags ?? []).includes(tag) : true,
  )
  return { ...result, page }
}

export async function getContactImpl(
  ctx: ReadCtx,
  { contactId }: { contactId: Id<"contacts"> },
) {
  const contact = await ctx.db.get(contactId)
  if (!contact) return null

  const rawMemberships = await ctx.db
    .query("memberships")
    .withIndex("by_contact", (q) => q.eq("contactId", contactId))
    .collect()
  const memberships = []
  for (const m of rawMemberships) {
    const campaign = await ctx.db.get(m.campaignId)
    const stage = await ctx.db.get(m.stageId)
    memberships.push({
      ...m,
      campaignName: campaign?.name ?? "—",
      stageName: stage?.name ?? "—",
      stageColor: stage?.color,
    })
  }

  const activities = await ctx.db
    .query("activities")
    .withIndex("by_contact", (q) => q.eq("contactId", contactId))
    .order("desc")
    .take(100)

  return { contact, memberships, activities }
}

const BOARD_CARD_LIMIT = 100

export async function boardColumnsImpl(
  ctx: ReadCtx,
  { campaignId }: { campaignId: Id<"campaigns"> },
) {
  const stages = await ctx.db
    .query("stages")
    .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
    .collect()
  stages.sort((a, b) => a.order - b.order)

  const columns = []
  for (const stage of stages) {
    const ms = await ctx.db
      .query("memberships")
      .withIndex("by_campaign_stage", (q) =>
        q.eq("campaignId", campaignId).eq("stageId", stage._id),
      )
      .order("desc")
      .take(BOARD_CARD_LIMIT)
    const cards: ContactRow[] = []
    for (const m of ms) {
      const c = await ctx.db.get(m.contactId)
      if (c) cards.push({ ...c, membershipId: m._id, stageId: m.stageId })
    }
    columns.push({ stage, count: stage.count ?? 0, cards })
  }
  return columns
}

// ---- Public, admin-gated queries ----

export const listContacts = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    stageId: v.optional(v.id("stages")),
    search: v.optional(v.string()),
    hasEmail: v.optional(v.boolean()),
    hasPhone: v.optional(v.boolean()),
    tag: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await listContactsImpl(ctx, args)
  },
})

export const getContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await getContactImpl(ctx, args)
  },
})

export const boardColumns = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await boardColumnsImpl(ctx, args)
  },
})

export const listCampaigns = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query("campaigns").order("desc").collect()
  },
})

export const listStages = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }) => {
    await requireAdmin(ctx)
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect()
    stages.sort((a, b) => a.order - b.order)
    return stages
  },
})
