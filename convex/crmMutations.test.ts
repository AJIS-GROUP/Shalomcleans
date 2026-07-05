import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
  addNoteImpl,
  addTagImpl,
  createCampaignImpl,
  deleteContactImpl,
  moveStageImpl,
  removeFromCampaignImpl,
  removeTagImpl,
} from "./crmMutations"

const modules = import.meta.glob("./**/*.ts")

/** A campaign with its seeded stages and three imported contacts in "New". */
async function seedWithContacts(t: TestConvex<typeof schema>) {
  const campaignId = await t.run((ctx) =>
    createCampaignImpl(ctx, { name: "Blitz" }),
  )
  const stages = await t.run((ctx) =>
    ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect(),
  )
  stages.sort((a, b) => a.order - b.order)
  const newStage = stages[0]
  await t.mutation(internal.crm.importChunk, {
    campaignId,
    stageId: newStage._id,
    rows: [
      { name: "Ada", email: "ada@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Carol", email: "carol@example.com" },
    ],
  })
  return { campaignId, stages }
}

describe("createCampaignImpl", () => {
  it("seeds per-campaign stages from the default template with count 0", async () => {
    const t = convexTest(schema, modules)
    const campaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "Blitz" }),
    )

    const campaign = await t.run((ctx) => ctx.db.get(campaignId))
    expect(campaign?.contactCount).toBe(0)

    const stages = await t.run((ctx) =>
      ctx.db
        .query("stages")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .collect(),
    )
    expect(stages.length).toBeGreaterThanOrEqual(3)
    expect(stages.every((s) => (s.count ?? 0) === 0)).toBe(true)
    // Orders are 0..n-1, unique.
    const orders = stages.map((s) => s.order).sort((a, b) => a - b)
    expect(orders).toEqual(orders.map((_, i) => i))
  })
})

describe("moveStageImpl", () => {
  it("moves a membership and shifts stage counts, logging the change", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stages } = await seedWithContacts(t)
    const from = stages[0]
    const to = stages[1]

    const membershipId: Id<"memberships"> = await t.run(async (ctx) => {
      const m = await ctx.db
        .query("memberships")
        .withIndex("by_campaign_stage", (q) =>
          q.eq("campaignId", campaignId).eq("stageId", from._id),
        )
        .first()
      return m!._id
    })

    await t.run((ctx) => moveStageImpl(ctx, { membershipId, stageId: to._id }))

    const fromStage = await t.run((ctx) => ctx.db.get(from._id))
    const toStage = await t.run((ctx) => ctx.db.get(to._id))
    const moved = await t.run((ctx) => ctx.db.get(membershipId))
    expect(fromStage?.count).toBe(2)
    expect(toStage?.count).toBe(1)
    expect(moved?.stageId).toBe(to._id)

    const activities = await t.run((ctx) =>
      ctx.db.query("activities").collect(),
    )
    expect(activities.some((a) => a.type === "stage_change")).toBe(true)
  })

  it("refuses to move a membership into another campaign's stage", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seedWithContacts(t)
    const otherCampaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "Other" }),
    )
    const otherStage = await t.run((ctx) =>
      ctx.db
        .query("stages")
        .withIndex("by_campaign", (q) => q.eq("campaignId", otherCampaignId))
        .first(),
    )
    const membershipId = await t.run(async (ctx) => {
      const m = await ctx.db
        .query("memberships")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .first()
      return m!._id
    })

    await expect(
      t.run((ctx) =>
        moveStageImpl(ctx, { membershipId, stageId: otherStage!._id }),
      ),
    ).rejects.toThrow()
  })
})

describe("deleteContactImpl", () => {
  it("cascades memberships + activities and decrements counts", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stages } = await seedWithContacts(t)
    const contactId = await t.run(async (ctx) => {
      const c = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("emailKey", "ada@example.com"))
        .first()
      return c!._id
    })

    await t.run((ctx) => deleteContactImpl(ctx, { contactId }))

    const contact = await t.run((ctx) => ctx.db.get(contactId))
    expect(contact).toBeNull()
    const memberships = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_contact", (q) => q.eq("contactId", contactId))
        .collect(),
    )
    expect(memberships).toHaveLength(0)
    const activities = await t.run((ctx) =>
      ctx.db
        .query("activities")
        .withIndex("by_contact", (q) => q.eq("contactId", contactId))
        .collect(),
    )
    expect(activities).toHaveLength(0)

    const campaign = await t.run((ctx) => ctx.db.get(campaignId))
    expect(campaign?.contactCount).toBe(2)
    const newStage = await t.run((ctx) => ctx.db.get(stages[0]._id))
    expect(newStage?.count).toBe(2)
  })
})

describe("removeFromCampaignImpl", () => {
  it("drops one membership + decrements counts but keeps the contact", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stages } = await seedWithContacts(t)
    const { membershipId, contactId } = await t.run(async (ctx) => {
      const m = await ctx.db
        .query("memberships")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .first()
      return { membershipId: m!._id, contactId: m!.contactId }
    })

    await t.run((ctx) => removeFromCampaignImpl(ctx, { membershipId }))

    expect(await t.run((ctx) => ctx.db.get(contactId))).not.toBeNull()
    const campaign = await t.run((ctx) => ctx.db.get(campaignId))
    expect(campaign?.contactCount).toBe(2)
    const newStage = await t.run((ctx) => ctx.db.get(stages[0]._id))
    expect(newStage?.count).toBe(2)
  })
})

describe("tags", () => {
  it("addTag is idempotent and removeTag removes", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seedWithContacts(t)
    const contactId = await t.run(async (ctx) => {
      const c = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("emailKey", "ada@example.com"))
        .first()
      return c!._id
    })

    await t.run((ctx) => addTagImpl(ctx, { contactId, tag: "vip" }))
    await t.run((ctx) => addTagImpl(ctx, { contactId, tag: "vip" }))
    expect(await t.run((ctx) => ctx.db.get(contactId))).toMatchObject({
      tags: ["vip"],
    })

    await t.run((ctx) => removeTagImpl(ctx, { contactId, tag: "vip" }))
    expect((await t.run((ctx) => ctx.db.get(contactId)))?.tags).toEqual([])
    expect(campaignId).toBeDefined()
  })
})

describe("addNoteImpl", () => {
  it("appends a note activity", async () => {
    const t = convexTest(schema, modules)
    await seedWithContacts(t)
    const contactId = await t.run(async (ctx) => {
      const c = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("emailKey", "ada@example.com"))
        .first()
      return c!._id
    })

    await t.run((ctx) =>
      addNoteImpl(ctx, { contactId, body: "Called, left voicemail" }),
    )

    const notes = await t.run((ctx) =>
      ctx.db
        .query("activities")
        .withIndex("by_contact", (q) => q.eq("contactId", contactId))
        .collect(),
    )
    expect(notes.some((n) => n.type === "note" && n.body === "Called, left voicemail")).toBe(true)
  })
})
