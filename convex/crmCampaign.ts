import { action, internalMutation } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { requireAdmin } from "./auth"

const PURGE_BATCH = 500

/**
 * Delete up to PURGE_BATCH of a campaign's memberships. Returns how many were
 * removed so the caller can loop until the campaign is drained — chunked so a
 * huge campaign never blows past Convex's per-transaction limit.
 */
export const _purgeCampaignChunk = internalMutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }): Promise<number> => {
    const batch = await ctx.db
      .query("memberships")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .take(PURGE_BATCH)
    for (const m of batch) await ctx.db.delete(m._id)
    return batch.length
  },
})

/** Delete a drained campaign's stages and the campaign row itself. */
export const _finalizeCampaignDelete = internalMutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }): Promise<void> => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
      .collect()
    for (const s of stages) await ctx.db.delete(s._id)
    await ctx.db.delete(campaignId)
  },
})

/**
 * Delete a campaign: drains its memberships in chunks, then removes its stages
 * and the campaign. Global contacts are left intact — they may belong to other
 * campaigns and live in the "All contacts" pool regardless.
 */
export const deleteCampaign = action({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, { campaignId }): Promise<void> => {
    await requireAdmin(ctx)
    let removed: number
    do {
      removed = await ctx.runMutation(
        internal.crmCampaign._purgeCampaignChunk,
        { campaignId },
      )
    } while (removed === PURGE_BATCH)
    await ctx.runMutation(internal.crmCampaign._finalizeCampaignDelete, {
      campaignId,
    })
  },
})
