import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

// convex-test needs the glob of function modules in this environment.
const modules = import.meta.glob("./**/*.ts")

/** Seed a campaign with a single "New" stage; returns their ids. */
async function seedCampaign(
  t: ReturnType<typeof convexTest>,
  name = "Campaign A",
): Promise<{ campaignId: Id<"campaigns">; stageId: Id<"stages"> }> {
  return await t.run(async (ctx) => {
    const campaignId = await ctx.db.insert("campaigns", {
      name,
      contactCount: 0,
    })
    const stageId = await ctx.db.insert("stages", {
      campaignId,
      name: "New",
      order: 0,
      color: "#888",
      type: "active",
    })
    return { campaignId, stageId }
  })
}

describe("importChunk dedupe/upsert", () => {
  it("creates a new contact + membership for a fresh email", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "Ada Lovelace", email: "ADA@Example.com", phone: "555-1234" }],
    })

    expect(summary).toMatchObject({ inserted: 1, updated: 0, skipped: 0 })

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    expect(contacts[0].emailKey).toBe("ada@example.com") // lowercased key
    expect(contacts[0].hasEmail).toBe(true)

    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(1)
    expect(memberships[0].stageId).toBe(stageId)
  })

  it("dedupes the same email within one chunk to a single contact", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [
        { name: "Ada", email: "ada@example.com" },
        { name: "Ada L", email: "ada@example.com" },
      ],
    })

    expect(summary.inserted).toBe(1)
    expect(summary.skipped).toBe(1)
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
  })

  it("skips a row whose contact is already in the campaign", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ email: "ada@example.com" }],
    })
    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ email: "ada@example.com" }],
    })

    expect(summary).toMatchObject({ inserted: 0, updated: 0, skipped: 1 })
    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(1)
  })

  it("merges only blank fields and keeps existing values", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "Ada", email: "ada@example.com" }],
    })
    // Re-import with a different name (should NOT overwrite) + new company (fills blank).
    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "Augusta", email: "ada@example.com", company: "Analytical Engines" }],
    })

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    expect(contacts[0].name).toBe("Ada") // existing kept
    expect(contacts[0].company).toBe("Analytical Engines") // blank filled
  })

  it("links an existing contact to a second campaign without duplicating it", async () => {
    const t = convexTest(schema, modules)
    const a = await seedCampaign(t, "A")
    const b = await seedCampaign(t, "B")

    await t.mutation(internal.crm.importChunk, {
      campaignId: a.campaignId,
      stageId: a.stageId,
      rows: [{ email: "ada@example.com" }],
    })
    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId: b.campaignId,
      stageId: b.stageId,
      rows: [{ email: "ada@example.com" }],
    })

    expect(summary).toMatchObject({ inserted: 0, updated: 1, skipped: 0 })
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(2)
  })

  it("falls back to phone dedupe when a row has no email", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "No Email", phone: "(555) 867-5309" }],
    })
    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "No Email Again", phone: "555-867-5309" }],
    })

    expect(summary.skipped).toBe(1) // matched by phone, already a member
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    expect(contacts[0].hasEmail).toBe(false)
    expect(contacts[0].hasPhone).toBe(true)
  })

  it("counts a row with no usable identity as invalid", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ custom: [{ key: "note", value: "nothing useful" }] }],
    })

    expect(summary.invalid).toBe(1)
    expect(summary.inserted).toBe(0)
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(0)
  })

  it("treats a name-only row (no email/phone) as invalid, never duplicating", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const first = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "John Smith" }],
    })
    const second = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "John Smith" }],
    })

    expect(first.invalid).toBe(1)
    expect(second.invalid).toBe(1)
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(0)
  })

  it("canonicalizes US phone numbers so a +1 prefix still merges", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "Jenny", phone: "555-867-5309" }],
    })
    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ name: "Jenny", phone: "+1 (555) 867-5309" }],
    })

    expect(summary.skipped).toBe(1) // matched existing by canonical phone
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
  })

  it("does not dedupe on ambiguous 7-digit phone numbers", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [
        { email: "a@x.com", phone: "123-4567" },
        { email: "b@x.com", phone: "123-4567" },
      ],
    })

    // Two distinct emails must stay distinct even though the 7-digit "phones" match.
    expect(summary.inserted).toBe(2)
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(2)
    expect(contacts.every((c) => c.phoneKey === undefined)).toBe(true)
  })

  it("sanitizes custom column keys so a non-ASCII header doesn't abort the chunk", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const summary = await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [
        {
          email: "ada@example.com",
          custom: [
            { key: "Región", value: "West" },
            { key: "_internal", value: "x" },
            { key: "", value: "empty" },
          ],
        },
      ],
    })

    expect(summary.inserted).toBe(1)
    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(1)
    const keys = Object.keys(contacts[0].custom ?? {})
    // Every stored key must be a legal Convex record key.
    expect(keys.every((k) => /^[\x20-\x7E]+$/.test(k) && !/^[$_]/.test(k))).toBe(
      true,
    )
  })

  it("won't copy a key already owned by another contact onto a match", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    // A: email only. B: phone only. They are (as far as the data knows) two people.
    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [
        { email: "a@x.com" },
        { name: "B", phone: "555-222-3333" },
      ],
    })

    // Row matches A by email, but its phone belongs to B.
    await t.mutation(internal.crm.importChunk, {
      campaignId,
      stageId,
      rows: [{ email: "a@x.com", phone: "555-222-3333" }],
    })

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    // No duplicate phoneKey may exist across contacts.
    const phoneKeys = contacts
      .map((c) => c.phoneKey)
      .filter((k): k is string => !!k)
    expect(new Set(phoneKeys).size).toBe(phoneKeys.length)
  })
})
