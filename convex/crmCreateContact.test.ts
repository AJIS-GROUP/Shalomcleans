import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { createCampaignImpl, createContactImpl } from "./crmMutations"

const modules = import.meta.glob("./**/*.ts")

async function seed(t: TestConvex<typeof schema>) {
  const campaignId = await t.run((ctx) =>
    createCampaignImpl(ctx, { name: "Manual" }),
  )
  const stages = await t.run((ctx) =>
    ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect(),
  )
  stages.sort((a, b) => a.order - b.order)
  return { campaignId, firstStageId: stages[0]._id }
}

describe("createContactImpl", () => {
  it("adds a contact to the first stage and bumps counts", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, firstStageId } = await seed(t)

    await t.run((ctx) =>
      createContactImpl(ctx, {
        campaignId,
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "(850) 111-2222",
      }),
    )

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(1)
    expect(memberships[0].stageId).toBe(firstStageId)

    const campaign = await t.run((ctx) => ctx.db.get(campaignId))
    expect(campaign?.contactCount).toBe(1)
    const stage = await t.run((ctx) => ctx.db.get(firstStageId))
    expect(stage?.count).toBe(1)
  })

  it("dedupes by email — re-adding the same person does not duplicate", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    await t.run((ctx) =>
      createContactImpl(ctx, { campaignId, email: "jane@example.com" }),
    )
    await t.run((ctx) =>
      createContactImpl(ctx, {
        campaignId,
        email: "jane@example.com",
        company: "Acme",
      }),
    )

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    const campaign = await t.run((ctx) => ctx.db.get(campaignId))
    expect(campaign?.contactCount).toBe(1) // not double-counted
  })

  it("rejects a contact with neither email nor phone", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    await expect(
      t.run((ctx) => createContactImpl(ctx, { campaignId, name: "No Contact" })),
    ).rejects.toThrow()
  })
})
