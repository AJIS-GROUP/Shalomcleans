import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import { createCampaignImpl } from "./crmMutations"

const modules = import.meta.glob("./**/*.ts")

async function seed(t: TestConvex<typeof schema>) {
  const campaignId = await t.run((ctx) =>
    createCampaignImpl(ctx, { name: "Doomed" }),
  )
  const stage = await t.run((ctx) =>
    ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .first(),
  )
  await t.mutation(internal.crm.importChunk, {
    campaignId,
    stageId: stage!._id,
    rows: [{ email: "a@x.com" }, { email: "b@x.com" }],
  })
  return { campaignId }
}

describe("deleteCampaign internals", () => {
  it("removes contacts that were only in the deleted campaign", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    const purged = await t.mutation(internal.crmCampaign._purgeCampaignChunk, {
      campaignId,
    })
    expect(purged).toBe(2)

    await t.mutation(internal.crmCampaign._finalizeCampaignDelete, {
      campaignId,
    })

    expect(await t.run((ctx) => ctx.db.get(campaignId))).toBeNull()
    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(0)
    // Contacts belonged only to this campaign, so they are gone too.
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(0)
    const activities = await t.run((ctx) =>
      ctx.db.query("activities").collect(),
    )
    expect(activities).toHaveLength(0)
  })

  it("keeps a contact that still belongs to another campaign", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t) // has a@x.com and b@x.com

    // A second campaign that also contains a@x.com.
    const otherId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "Keeper" }),
    )
    const otherStage = await t.run((ctx) =>
      ctx.db
        .query("stages")
        .withIndex("by_campaign", (q) => q.eq("campaignId", otherId))
        .first(),
    )
    await t.mutation(internal.crm.importChunk, {
      campaignId: otherId,
      stageId: otherStage!._id,
      rows: [{ email: "a@x.com" }],
    })

    await t.mutation(internal.crmCampaign._purgeCampaignChunk, { campaignId })

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    // b@x.com (only in the deleted campaign) is gone; a@x.com (in Keeper) stays.
    expect(contacts.map((c) => c.emailKey)).toEqual(["a@x.com"])
  })
})
