import { mutation } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { requireAdmin } from "./auth"
import { logActivity, type WriteCtx } from "./crm"

// Fallback pipeline used when no global default template has been configured.
const DEFAULT_STAGES: Array<{
  name: string
  color: string
  type: "active" | "won" | "lost"
}> = [
  { name: "New", color: "#8b9cff", type: "active" },
  { name: "Contacted", color: "#6ee7b7", type: "active" },
  { name: "Replied", color: "#fcd34d", type: "active" },
  { name: "Qualified", color: "#c4b5fd", type: "active" },
  { name: "Won", color: "#c4f54a", type: "won" },
  { name: "Lost", color: "#f87171", type: "lost" },
]

const NOTE_MAX = 2000

function dec(n: number | undefined): number {
  return Math.max(0, (n ?? 0) - 1)
}

// ---- Campaign ----

export async function createCampaignImpl(
  ctx: WriteCtx,
  args: { name: string; description?: string; color?: string },
): Promise<Id<"campaigns">> {
  const campaignId = await ctx.db.insert("campaigns", {
    name: args.name.trim() || "Untitled campaign",
    description: args.description,
    color: args.color,
    contactCount: 0,
  })

  // Seed stages from the editable global template (campaignId undefined), or the
  // constant fallback if none exists yet.
  const template = await ctx.db
    .query("stages")
    .withIndex("by_campaign", (q) => q.eq("campaignId", undefined))
    .collect()
  template.sort((a, b) => a.order - b.order)
  const seeds =
    template.length > 0
      ? template.map((s) => ({ name: s.name, color: s.color, type: s.type }))
      : DEFAULT_STAGES

  let order = 0
  for (const s of seeds) {
    await ctx.db.insert("stages", {
      campaignId,
      name: s.name,
      order: order++,
      color: s.color,
      type: s.type,
      count: 0,
    })
  }
  return campaignId
}

/** Add an existing contact to a campaign's first stage, unless already a member. */
export async function addContactToCampaignImpl(
  ctx: WriteCtx,
  args: { contactId: Id<"contacts">; campaignId: Id<"campaigns">; by?: string },
): Promise<void> {
  const existing = await ctx.db
    .query("memberships")
    .withIndex("by_contact_campaign", (q) =>
      q.eq("contactId", args.contactId).eq("campaignId", args.campaignId),
    )
    .first()
  if (existing) return

  const stages = await ctx.db
    .query("stages")
    .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
    .collect()
  stages.sort((a, b) => a.order - b.order)
  const first = stages[0]
  if (!first) return

  await ctx.db.insert("memberships", {
    contactId: args.contactId,
    campaignId: args.campaignId,
    stageId: first._id,
    addedAt: Date.now(),
  })
  await ctx.db.patch(first._id, { count: (first.count ?? 0) + 1 })
  const camp = await ctx.db.get(args.campaignId)
  if (camp) {
    await ctx.db.patch(args.campaignId, {
      contactCount: camp.contactCount + 1,
    })
  }
  await logActivity(ctx, {
    contactId: args.contactId,
    campaignId: args.campaignId,
    type: "import",
    by: args.by,
  })
}

// ---- Stage movement ----

export async function moveStageImpl(
  ctx: WriteCtx,
  args: { membershipId: Id<"memberships">; stageId: Id<"stages">; by?: string },
): Promise<void> {
  const m = await ctx.db.get(args.membershipId)
  if (!m) throw new Error("Membership not found")
  if (m.stageId === args.stageId) return

  const newStage = await ctx.db.get(args.stageId)
  if (!newStage) throw new Error("Stage not found")
  if (newStage.campaignId !== m.campaignId) {
    throw new Error("Cannot move a contact into another campaign's stage")
  }
  const oldStage = await ctx.db.get(m.stageId)

  await ctx.db.patch(args.membershipId, { stageId: args.stageId })
  if (oldStage) await ctx.db.patch(oldStage._id, { count: dec(oldStage.count) })
  await ctx.db.patch(args.stageId, { count: (newStage.count ?? 0) + 1 })

  await logActivity(ctx, {
    contactId: m.contactId,
    campaignId: m.campaignId,
    type: "stage_change",
    meta: { from: oldStage?.name, to: newStage.name },
    by: args.by,
  })
}

// ---- Deletion ----

export async function deleteContactImpl(
  ctx: WriteCtx,
  { contactId }: { contactId: Id<"contacts"> },
): Promise<void> {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_contact", (q) => q.eq("contactId", contactId))
    .collect()
  for (const m of memberships) {
    const stage = await ctx.db.get(m.stageId)
    if (stage) await ctx.db.patch(stage._id, { count: dec(stage.count) })
    const camp = await ctx.db.get(m.campaignId)
    if (camp) await ctx.db.patch(camp._id, { contactCount: dec(camp.contactCount) })
    await ctx.db.delete(m._id)
  }
  const activities = await ctx.db
    .query("activities")
    .withIndex("by_contact", (q) => q.eq("contactId", contactId))
    .collect()
  for (const a of activities) await ctx.db.delete(a._id)
  await ctx.db.delete(contactId)
}

export async function removeFromCampaignImpl(
  ctx: WriteCtx,
  { membershipId }: { membershipId: Id<"memberships"> },
): Promise<void> {
  const m = await ctx.db.get(membershipId)
  if (!m) return
  const stage = await ctx.db.get(m.stageId)
  if (stage) await ctx.db.patch(stage._id, { count: dec(stage.count) })
  const camp = await ctx.db.get(m.campaignId)
  if (camp) await ctx.db.patch(camp._id, { contactCount: dec(camp.contactCount) })
  await ctx.db.delete(membershipId)
}

// ---- Tags ----

export async function addTagImpl(
  ctx: WriteCtx,
  { contactId, tag, by }: { contactId: Id<"contacts">; tag: string; by?: string },
): Promise<void> {
  const t = tag.trim()
  if (!t) return
  const c = await ctx.db.get(contactId)
  if (!c) return
  const tags = c.tags ?? []
  if (tags.includes(t)) return
  await ctx.db.patch(contactId, { tags: [...tags, t] })
  await logActivity(ctx, { contactId, type: "tag", meta: { added: t }, by })
}

export async function removeTagImpl(
  ctx: WriteCtx,
  { contactId, tag }: { contactId: Id<"contacts">; tag: string },
): Promise<void> {
  const c = await ctx.db.get(contactId)
  if (!c) return
  await ctx.db.patch(contactId, {
    tags: (c.tags ?? []).filter((x) => x !== tag),
  })
}

// ---- Activity logging ----

export async function addNoteImpl(
  ctx: WriteCtx,
  args: {
    contactId: Id<"contacts">
    campaignId?: Id<"campaigns">
    body: string
    by?: string
  },
): Promise<void> {
  const text = args.body.trim()
  if (!text) return
  await logActivity(ctx, {
    contactId: args.contactId,
    campaignId: args.campaignId,
    type: "note",
    body: text.slice(0, NOTE_MAX),
    by: args.by,
  })
}

export async function logInteractionImpl(
  ctx: WriteCtx,
  args: {
    contactId: Id<"contacts">
    campaignId?: Id<"campaigns">
    kind: "call" | "email"
    body?: string
    by?: string
  },
): Promise<void> {
  await logActivity(ctx, {
    contactId: args.contactId,
    campaignId: args.campaignId,
    type: args.kind,
    body: args.body?.trim().slice(0, NOTE_MAX),
    by: args.by,
  })
}

// ---- Public, admin-gated mutations ----

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await createCampaignImpl(ctx, args)
  },
})

export const moveStage = mutation({
  args: {
    membershipId: v.id("memberships"),
    stageId: v.id("stages"),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)
    await moveStageImpl(ctx, { ...args, by: user.email ?? undefined })
  },
})

export const deleteContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await deleteContactImpl(ctx, args)
  },
})

export const removeFromCampaign = mutation({
  args: { membershipId: v.id("memberships") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await removeFromCampaignImpl(ctx, args)
  },
})

export const addToCampaign = mutation({
  args: { contactId: v.id("contacts"), campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)
    await addContactToCampaignImpl(ctx, { ...args, by: user.email ?? undefined })
  },
})

export const addTag = mutation({
  args: { contactId: v.id("contacts"), tag: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)
    await addTagImpl(ctx, { ...args, by: user.email ?? undefined })
  },
})

export const removeTag = mutation({
  args: { contactId: v.id("contacts"), tag: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await removeTagImpl(ctx, args)
  },
})

export const addNote = mutation({
  args: {
    contactId: v.id("contacts"),
    campaignId: v.optional(v.id("campaigns")),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)
    await addNoteImpl(ctx, { ...args, by: user.email ?? undefined })
  },
})

export const logInteraction = mutation({
  args: {
    contactId: v.id("contacts"),
    campaignId: v.optional(v.id("campaigns")),
    kind: v.union(v.literal("call"), v.literal("email")),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx)
    await logInteractionImpl(ctx, { ...args, by: user.email ?? undefined })
  },
})
