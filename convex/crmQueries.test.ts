import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
  boardColumnsImpl,
  getContactImpl,
  listContactsImpl,
} from "./crmQueries"

const modules = import.meta.glob("./**/*.ts")

async function seed(t: ReturnType<typeof convexTest>) {
  const { campaignId, newStageId, wonStageId } = await t.run(async (ctx) => {
    const campaignId = await ctx.db.insert("campaigns", {
      name: "Q3 Outreach",
      contactCount: 0,
    })
    const newStageId = await ctx.db.insert("stages", {
      campaignId,
      name: "New",
      order: 0,
      color: "#888",
      type: "active",
    })
    const wonStageId = await ctx.db.insert("stages", {
      campaignId,
      name: "Won",
      order: 1,
      color: "#0f0",
      type: "won",
    })
    return { campaignId, newStageId, wonStageId }
  })

  await t.mutation(internal.crm.importChunk, {
    campaignId,
    stageId: newStageId,
    rows: [
      { name: "Ada Lovelace", email: "ada@example.com", company: "Analytical" },
      { name: "Bob Jones", email: "bob@example.com" },
      { name: "Carol King", email: "carol@example.com" },
    ],
  })
  return { campaignId, newStageId, wonStageId }
}

describe("listContactsImpl", () => {
  it("scoped to a campaign returns that campaign's contacts with their stage", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, newStageId } = await seed(t)

    const result = await t.run((ctx) =>
      listContactsImpl(ctx, {
        campaignId,
        paginationOpts: { numItems: 10, cursor: null },
      }),
    )

    expect(result.page).toHaveLength(3)
    expect(result.page.every((r) => r.stageId === newStageId)).toBe(true)
  })

  it("filters a campaign view by stage", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, newStageId, wonStageId } = await seed(t)

    // Move Ada to Won directly (moveStage is Phase 4).
    await t.run(async (ctx) => {
      const m = await ctx.db
        .query("memberships")
        .withIndex("by_campaign_stage", (q) =>
          q.eq("campaignId", campaignId).eq("stageId", newStageId),
        )
        .first()
      if (m) await ctx.db.patch(m._id, { stageId: wonStageId })
    })

    const wonPage = await t.run((ctx) =>
      listContactsImpl(ctx, {
        campaignId,
        stageId: wonStageId,
        paginationOpts: { numItems: 10, cursor: null },
      }),
    )
    expect(wonPage.page).toHaveLength(1)
  })

  it("global search matches name/email/company", async () => {
    const t = convexTest(schema, modules)
    await seed(t)

    const result = await t.run((ctx) =>
      listContactsImpl(ctx, {
        search: "analytical",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    )
    expect(result.page).toHaveLength(1)
    expect(result.page[0].email).toBe("ada@example.com")
  })
})

describe("getContactImpl", () => {
  it("returns the contact, its memberships, and a reverse-chron timeline", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    const contactId: Id<"contacts"> = await t.run(async (ctx) => {
      const c = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("emailKey", "ada@example.com"))
        .first()
      return c!._id
    })

    const detail = await t.run((ctx) => getContactImpl(ctx, { contactId }))

    expect(detail?.contact.email).toBe("ada@example.com")
    expect(detail?.memberships).toHaveLength(1)
    expect(detail?.memberships[0].campaignId).toBe(campaignId)
    expect(detail?.memberships[0].campaignName).toBe("Q3 Outreach")
    // created + import activities, newest first.
    expect(detail!.activities.length).toBeGreaterThanOrEqual(2)
    const times = detail!.activities.map((a) => a._creationTime)
    expect(times).toEqual([...times].sort((a, b) => b - a))
  })
})

describe("boardColumnsImpl", () => {
  it("returns each stage with a denormalized count and cards", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    const columns = await t.run((ctx) =>
      boardColumnsImpl(ctx, { campaignId }),
    )

    expect(columns.map((c) => c.stage.name)).toEqual(["New", "Won"])
    const newCol = columns.find((c) => c.stage.name === "New")!
    expect(newCol.count).toBe(3) // maintained by importChunk, no scan
    expect(newCol.cards).toHaveLength(3)
    const wonCol = columns.find((c) => c.stage.name === "Won")!
    expect(wonCol.count).toBe(0)
  })

  it("caps cards per stage at perColumn while keeping the full count", async () => {
    const t = convexTest(schema, modules)
    const { campaignId } = await seed(t)

    const columns = await t.run((ctx) =>
      boardColumnsImpl(ctx, { campaignId, perColumn: 2 }),
    )
    const newCol = columns.find((c) => c.stage.name === "New")!
    expect(newCol.count).toBe(3) // full count still reported
    expect(newCol.cards).toHaveLength(2) // but only perColumn cards loaded
  })
})
