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
  it("purges memberships then deletes stages + campaign, keeping contacts", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    const purged = await t.mutation(
      internal.crmCampaign._purgeCampaignChunk,
      { campaignId },
    )
    expect(purged).toBe(2)

    await t.mutation(internal.crmCampaign._finalizeCampaignDelete, {
      campaignId,
    })

    expect(await t.run((ctx) => ctx.db.get(campaignId))).toBeNull()
    const stages = await t.run((ctx) =>
      ctx.db
        .query("stages")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .collect(),
    )
    expect(stages).toHaveLength(0)
    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(0)
    // Global contacts survive — they may belong to other campaigns.
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(2)
  })
})
