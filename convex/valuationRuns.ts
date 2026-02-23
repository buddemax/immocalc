import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier } from "./plan";
import { buildValuationInput } from "../src/lib/calculations/valuation/fromProperty";
import { calcValuationSuite, pickScenario } from "../src/lib/calculations/valuation/suite";
import { CALC_ENGINE_VERSION } from "../src/lib/calculations/version";

function stableHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export const createFromCurrentInputs = mutation({
  args: {
    propertyId: v.id("properties"),
    scenarioId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "valuation_report");

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const snapshots = await ctx.db
      .query("marketDataSnapshots")
      .withIndex("by_property", (queryBuilder) => queryBuilder.eq("propertyId", args.propertyId))
      .collect();

    const scenario = pickScenario(args.scenarioId);
    const valuationInput = buildValuationInput(property, snapshots);
    const suite = calcValuationSuite(valuationInput, scenario);
    const inputHash = stableHash(JSON.stringify({ valuationInput, scenario }));

    return ctx.db.insert("valuationRuns", {
      userId: identity.subject,
      propertyId: args.propertyId,
      runAt: new Date().toISOString(),
      inputHash,
      parameterSetVersion: CALC_ENGINE_VERSION,
      methods: ["ertragswert", "vergleichswert", "sachwert"],
      results: {
        primaryValue: suite.ertragswert.value,
        ertragswert: suite.ertragswert.value,
        vergleichswert: suite.vergleichswert.value,
        sachwert: suite.sachwert.value,
        bandLow: Math.min(suite.ertragswert.bandLow, suite.vergleichswert.bandLow, suite.sachwert.bandLow),
        bandHigh: Math.max(suite.ertragswert.bandHigh, suite.vergleichswert.bandHigh, suite.sachwert.bandHigh),
      },
      warnings: suite.warnings,
      scenarioId: scenario.id,
    });
  },
});

export const list = query({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    return ctx.db
      .query("valuationRuns")
      .withIndex("by_property", (queryBuilder) => queryBuilder.eq("propertyId", args.propertyId))
      .collect();
  },
});
