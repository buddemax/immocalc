import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier } from "./plan";
import { DEFAULT_REGULATORY_PARAMETERS } from "../src/lib/data/regulatoryDefaults";

const argsValidator = {
  country: v.string(),
  regionKey: v.string(),
  validFrom: v.string(),
  validTo: v.optional(v.string()),
  version: v.string(),
  transferTax: v.float64(),
  afaRules: v.object({
    defaultRate: v.float64(),
    post1925Rate: v.float64(),
    pre1925Rate: v.float64(),
  }),
  opCostDefaults: v.object({
    vacancyRate: v.float64(),
    adminRate: v.float64(),
    maintenancePerSqmAnnual: v.float64(),
  }),
  valuationDefaults: v.object({
    capRateFloor: v.float64(),
    capRateCeil: v.float64(),
    marketAdjustmentFloor: v.float64(),
    marketAdjustmentCeil: v.float64(),
  }),
};

export const upsert = mutation({
  args: {
    id: v.optional(v.id("regulatoryParameterSets")),
    ...argsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "valuation_v2");

    if (args.id) {
      const { id, ...patch } = args;
      await ctx.db.patch(id, patch);
      return id;
    }

    return ctx.db.insert("regulatoryParameterSets", args);
  },
});

export const listByRegion = query({
  args: {
    regionKey: v.string(),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const region = await ctx.db
      .query("regulatoryParameterSets")
      .withIndex("by_region", (queryBuilder) => queryBuilder.eq("regionKey", args.regionKey))
      .collect();

    const country = await ctx.db
      .query("regulatoryParameterSets")
      .withIndex("by_country", (queryBuilder) => queryBuilder.eq("country", "DE"))
      .collect();

    return [...region, ...country];
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "valuation_v2");

    const inserted: string[] = [];
    for (const entry of DEFAULT_REGULATORY_PARAMETERS) {
      const existing = await ctx.db
        .query("regulatoryParameterSets")
        .withIndex("by_region", (queryBuilder) => queryBuilder.eq("regionKey", entry.regionKey))
        .first();

      if (existing) {
        continue;
      }

      const id = await ctx.db.insert("regulatoryParameterSets", entry);
      inserted.push(id);
    }

    return { inserted: inserted.length };
  },
});
