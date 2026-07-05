import { convexTest, type TestConvex } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { createCampaignImpl } from "./crmMutations"
import { addContactToCampaignImpl, applyBulkChunkImpl } from "./crmBulk"

const modules = import.meta.glob("./**/*.ts")

async function seed(t: TestConvex<typeof schema>) {
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
  await t.mutation(internal.crm.importChunk, {
    campaignId,
    stageId: stages[0]._id,
    rows: [
      { name: "Ada", email: "ada@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Carol", email: "carol@example.com" },
    ],
  })
  const contactIds = await t.run((ctx) =>
    ctx.db.query("contacts").collect(),
  )
  return { campaignId, stages, contactIds: contactIds.map((c) => c._id) }
}

describe("applyBulkChunkImpl", () => {
  it("tags every contact in the chunk", async () => {
    const t = convexTest(schema, modules)
    const { contactIds } = await seed(t)

    await t.run((ctx) =>
      applyBulkChunkImpl(ctx, {
        action: { kind: "addTag", tag: "vip" },
        contactIds,
      }),
    )

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts.every((c) => (c.tags ?? []).includes("vip"))).toBe(true)
  })

  it("moves every contact's membership to the target stage", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stages, contactIds } = await seed(t)
    const won = stages.find((s) => s.type === "won")!

    await t.run((ctx) =>
      applyBulkChunkImpl(ctx, {
        action: { kind: "setStage", campaignId, stageId: won._id },
        contactIds,
      }),
    )

    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships.every((m) => m.stageId === won._id)).toBe(true)
    const wonStage = await t.run((ctx) => ctx.db.get(won._id))
    expect(wonStage?.count).toBe(3)
    const newStage = await t.run((ctx) => ctx.db.get(stages[0]._id))
    expect(newStage?.count).toBe(0)
  })

  it("deletes every contact in the chunk and clears counts", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, contactIds } = await seed(t)

    await t.run((ctx) =>
      applyBulkChunkImpl(ctx, { action: { kind: "delete" }, contactIds }),
    )

    expect(await t.run((ctx) => ctx.db.query("contacts").collect())).toHaveLength(
      0,
    )
    const campaign = await t.run((ctx) => ctx.db.get(campaignId))
    expect(campaign?.contactCount).toBe(0)
  })
})

describe("addContactToCampaignImpl", () => {
  it("adds a contact to another campaign's first stage, idempotently", async () => {
    const t = convexTest(schema, modules)
    const { contactIds } = await seed(t)
    const otherId = await t.run((ctx) =>
      createCampaignImpl(ctx, { name: "Second" }),
    )
    const contactId = contactIds[0]

    await t.run((ctx) =>
      addContactToCampaignImpl(ctx, { contactId, campaignId: otherId }),
    )
    await t.run((ctx) =>
      addContactToCampaignImpl(ctx, { contactId, campaignId: otherId }),
    )

    const memberships = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_contact_campaign", (q) =>
          q.eq("contactId", contactId).eq("campaignId", otherId),
        )
        .collect(),
    )
    expect(memberships).toHaveLength(1)
    const other = await t.run((ctx) => ctx.db.get(otherId))
    expect(other?.contactCount).toBe(1)
  })
})

describe("_runBulk (filter selection)", () => {
  it("enumerates all matching contacts, sets total, applies, marks done", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    const jobId: Id<"importJobs"> = await t.run((ctx) =>
      ctx.db.insert("importJobs", {
        kind: "bulk",
        action: "addTag",
        status: "pending",
        total: 0,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        invalid: 0,
      }),
    )

    await t.action(internal.crmBulk._runBulk, {
      jobId,
      action: { kind: "addTag", tag: "vip" },
      selection: { filter: { campaignId } },
    })

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts.every((c) => (c.tags ?? []).includes("vip"))).toBe(true)
    const job = await t.run((ctx) => ctx.db.get(jobId))
    expect(job?.status).toBe("done")
    expect(job?.total).toBe(3)
    expect(job?.processed).toBe(3)
  })
})
