// @vitest-environment node
// _runImport parses via SheetJS in a "use node" action, so exercise it under
// the Node runtime rather than the edge-runtime VM the other Convex tests use.
import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import schema from "./schema"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { mapRows } from "./crmImport"

const modules = import.meta.glob("./**/*.ts")

async function seedCampaign(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const campaignId = await ctx.db.insert("campaigns", {
      name: "Import Test",
      contactCount: 0,
    })
    // Two stages; the importer must pick the lowest-order one.
    await ctx.db.insert("stages", {
      campaignId,
      name: "Contacted",
      order: 1,
      color: "#777",
      type: "active",
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

describe("mapRows", () => {
  it("routes headers to core fields, custom pairs, and ignores the rest", () => {
    const out = mapRows(
      [
        {
          "Full Name": "Ada",
          Email: "a@x.com",
          Company: "Acme",
          Extra: "z",
          Skip: "q",
        },
      ],
      [
        { header: "Full Name", target: "name" },
        { header: "Email", target: "email" },
        { header: "Company", target: "company" },
        { header: "Extra", target: "custom" },
        { header: "Skip", target: "ignore" },
      ],
    )

    expect(out).toEqual([
      {
        name: "Ada",
        email: "a@x.com",
        company: "Acme",
        custom: [{ key: "Extra", value: "z" }],
      },
    ])
  })

  it("omits empty cells rather than emitting blank fields", () => {
    const out = mapRows(
      [{ Email: "  ", Name: "Bob" }],
      [
        { header: "Email", target: "email" },
        { header: "Name", target: "name" },
      ],
    )
    expect(out).toEqual([{ name: "Bob" }])
  })

  it("keeps the first column when two map to the same field, demoting the rest to custom", () => {
    const out = mapRows(
      [{ "Work Email": "work@x.com", "Personal Email": "home@x.com" }],
      [
        { header: "Work Email", target: "email" },
        { header: "Personal Email", target: "email" },
      ],
    )
    expect(out).toEqual([
      {
        email: "work@x.com",
        custom: [{ key: "Personal Email", value: "home@x.com" }],
      },
    ])
  })
})

describe("importFromStorage (_runImport)", () => {
  it("parses a stored CSV and imports into the campaign's first stage", async () => {
    const t = convexTest(schema, modules)
    const { campaignId, stageId } = await seedCampaign(t)

    const csv = [
      "Name,Email,Phone,Region",
      "Ada,ada@example.com,555-867-5309,West",
      "Bob,bob@example.com,,East",
    ].join("\n")

    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob([csv], { type: "text/csv" })),
    )

    const jobId: Id<"importJobs"> = await t.run((ctx) =>
      ctx.db.insert("importJobs", {
        kind: "import",
        campaignId,
        status: "pending",
        total: 0,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        invalid: 0,
      }),
    )

    // campaignId is derived from the job, not passed by the caller.
    const args = {
      jobId,
      storageId,
      mapping: [
        { header: "Name", target: "name" as const },
        { header: "Email", target: "email" as const },
        { header: "Phone", target: "phone" as const },
        { header: "Region", target: "custom" as const },
      ],
    }
    await t.action(internal.crmImportNode._runImport, args)

    const contacts = await t.run((ctx) => ctx.db.query("contacts").collect())
    expect(contacts).toHaveLength(2)

    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    )
    expect(memberships).toHaveLength(2)
    expect(memberships.every((m) => m.stageId === stageId)).toBe(true)

    const job = await t.run((ctx) => ctx.db.get(jobId))
    expect(job?.status).toBe("done")
    expect(job?.total).toBe(2)
    expect(job?.inserted).toBe(2)

    // Re-invoking the same job is a no-op: it is no longer "pending".
    await t.action(internal.crmImportNode._runImport, args)
    const after = await t.run((ctx) => ctx.db.get(jobId))
    expect(after?.inserted).toBe(2) // not double-counted
    const contactsAfter = await t.run((ctx) =>
      ctx.db.query("contacts").collect(),
    )
    expect(contactsAfter).toHaveLength(2)
  })
})
