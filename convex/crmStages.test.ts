import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
  addStageImpl,
  createCampaignImpl,
  deleteStageImpl,
  reorderStagesImpl,
  updateStageImpl,
} from "./crmMutations"

const modules = import.meta.glob("./**/*.ts")

async function campaignStages(t: TestConvex<typeof schema>, campaignId: Id<"campaigns">) {
  const s = await t.run((ctx) =>
    ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect(),
  )
  s.sort((a, b) => a.order - b.order)
  return s
}

describe("addStageImpl", () => {
  it("appends a stage with the next order and count 0", async () => {
    const t = convexTest(schema, modules)
    const campaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "C" }),
    )
    const before = await campaignStages(t, campaignId)

    const id = await t.run((ctx) =>
      addStageImpl(ctx, {
        campaignId,
        name: "Nurture",
        color: "#abc",
        type: "active",
      }),
    )

    const after = await campaignStages(t, campaignId)
    expect(after).toHaveLength(before.length + 1)
    const added = after.find((s) => s._id === id)!
    expect(added.order).toBe(before.length) // next order
    expect(added.count ?? 0).toBe(0)
  })
})

describe("updateStageImpl", () => {
  it("renames, recolors, and retypes a stage", async () => {
    const t = convexTest(schema, modules)
    const campaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "C" }),
    )
    const [first] = await campaignStages(t, campaignId)

    await t.run((ctx) =>
      updateStageImpl(ctx, {
        stageId: first._id,
        name: "Fresh",
        color: "#123456",
        type: "won",
      }),
    )

    const updated = await t.run((ctx) => ctx.db.get(first._id))
    expect(updated).toMatchObject({
      name: "Fresh",
      color: "#123456",
      type: "won",
    })
  })
})

describe("reorderStagesImpl", () => {
  it("sets each stage's order to its index in the list", async () => {
    const t = convexTest(schema, modules)
    const campaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "C" }),
    )
    const stages = await campaignStages(t, campaignId)
    const reversed = [...stages].reverse().map((s) => s._id)

    await t.run((ctx) => reorderStagesImpl(ctx, { orderedIds: reversed }))

    const after = await campaignStages(t, campaignId)
    // The stage that was last is now order 0.
    expect(after[0]._id).toBe(reversed[0])
    expect(after.map((s) => s.order)).toEqual(after.map((_, i) => i))
  })
})

describe("deleteStageImpl", () => {
  it("reassigns memberships + count then removes the stage", async () => {
    const t = convexTest(schema, modules)
    const campaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "C" }),
    )
    const stages = await campaignStages(t, campaignId)
    const from = stages[0]
    const to = stages[1]
    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId: from._id,
      rows: [
        { email: "a@x.com" },
        { email: "b@x.com" },
      ],
    })

    await t.run((ctx) =>
      deleteStageImpl(ctx, { stageId: from._id, reassignToStageId: to._id }),
    )

    expect(await t.run((ctx) => ctx.db.get(from._id))).toBeNull()
    const toStage = await t.run((ctx) => ctx.db.get(to._id))
    expect(toStage?.count).toBe(2)
    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships.every((m) => m.stageId === to._id)).toBe(true)
  })

  it("refuses to delete a non-empty stage without a reassignment target", async () => {
    const t = convexTest(schema, modules)
    const campaignId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "C" }),
    )
    const [from] = await campaignStages(t, campaignId)
    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId: from._id,
      rows: [{ email: "a@x.com" }],
    })

    await expect(
      t.run((ctx) => deleteStageImpl(ctx, { stageId: from._id })),
    ).rejects.toThrow()
  })
})
