import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier } from "./plan";

const marketDataSnapshotArgs = {
  propertyId: v.id("properties"),
  metric: v.union(
    v.literal("land_value_per_sqm"),
    v.literal("cap_rate"),
    v.literal("market_rent_per_sqm"),
    v.literal("property_price_per_sqm"),
    v.literal("material_factor"),
    v.literal("regional_vacancy_rate"),
    v.literal("poi_supermarket_1km"),
    v.literal("poi_school_1km"),
    v.literal("poi_transit_1km"),
    v.literal("distance_transit_m"),
    v.literal("distance_center_m"),
  ),
  value: v.float64(),
  unit: v.union(v.literal("eur_per_sqm"), v.literal("percent"), v.literal("factor"), v.literal("meters")),
  sourceLabel: v.string(),
  sourceUrl: v.optional(v.string()),
  effectiveDate: v.string(),
  confidence: v.float64(),
  regionKey: v.string(),
};

export const upsertManualSnapshot = mutation({
  args: {
    id: v.optional(v.id("marketDataSnapshots")),
    ...marketDataSnapshotArgs,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "valuation_v2");

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.userId !== identity.subject || existing.propertyId !== args.propertyId) {
        throw new Error("Snapshot not found");
      }

      await ctx.db.patch(args.id, {
        metric: args.metric,
        value: args.value,
        unit: args.unit,
        sourceType: "manual",
        sourceLabel: args.sourceLabel,
        sourceUrl: args.sourceUrl,
        effectiveDate: args.effectiveDate,
        confidence: args.confidence,
        regionKey: args.regionKey,
      });
      return args.id;
    }

    return ctx.db.insert("marketDataSnapshots", {
      userId: identity.subject,
      propertyId: args.propertyId,
      metric: args.metric,
      value: args.value,
      unit: args.unit,
      sourceType: "manual",
      sourceLabel: args.sourceLabel,
      sourceUrl: args.sourceUrl,
      effectiveDate: args.effectiveDate,
      confidence: args.confidence,
      regionKey: args.regionKey,
    });
  },
});

export const upsertCsvSnapshots = mutation({
  args: {
    propertyId: v.id("properties"),
    snapshots: v.array(
      v.object({
        metric: marketDataSnapshotArgs.metric,
        value: marketDataSnapshotArgs.value,
        unit: marketDataSnapshotArgs.unit,
        sourceLabel: marketDataSnapshotArgs.sourceLabel,
        sourceUrl: marketDataSnapshotArgs.sourceUrl,
        effectiveDate: marketDataSnapshotArgs.effectiveDate,
        confidence: marketDataSnapshotArgs.confidence,
        regionKey: marketDataSnapshotArgs.regionKey,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "market_data_import");

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const ids = [];
    for (const snapshot of args.snapshots) {
      const id = await ctx.db.insert("marketDataSnapshots", {
        userId: identity.subject,
        propertyId: args.propertyId,
        metric: snapshot.metric,
        value: snapshot.value,
        unit: snapshot.unit,
        sourceType: "csv_import",
        sourceLabel: snapshot.sourceLabel,
        sourceUrl: snapshot.sourceUrl,
        effectiveDate: snapshot.effectiveDate,
        confidence: snapshot.confidence,
        regionKey: snapshot.regionKey,
      });
      ids.push(id);
    }

    return ids;
  },
});

export const upsertFromApi = mutation({
  args: {
    propertyId: v.id("properties"),
    metric: marketDataSnapshotArgs.metric,
    value: marketDataSnapshotArgs.value,
    unit: marketDataSnapshotArgs.unit,
    sourceType: v.union(v.literal("api_geo"), v.literal("api_boris"), v.literal("internal_default")),
    sourceLabel: marketDataSnapshotArgs.sourceLabel,
    sourceUrl: marketDataSnapshotArgs.sourceUrl,
    effectiveDate: marketDataSnapshotArgs.effectiveDate,
    confidence: marketDataSnapshotArgs.confidence,
    regionKey: marketDataSnapshotArgs.regionKey,
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const existing = await ctx.db
      .query("marketDataSnapshots")
      .withIndex("by_property_metric", (queryBuilder) =>
        queryBuilder.eq("propertyId", args.propertyId).eq("metric", args.metric),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        unit: args.unit,
        sourceType: args.sourceType,
        sourceLabel: args.sourceLabel,
        sourceUrl: args.sourceUrl,
        effectiveDate: args.effectiveDate,
        confidence: args.confidence,
        regionKey: args.regionKey,
      });
      return existing._id;
    }

    return ctx.db.insert("marketDataSnapshots", {
      userId: identity.subject,
      propertyId: args.propertyId,
      metric: args.metric,
      value: args.value,
      unit: args.unit,
      sourceType: args.sourceType,
      sourceLabel: args.sourceLabel,
      sourceUrl: args.sourceUrl,
      effectiveDate: args.effectiveDate,
      confidence: args.confidence,
      regionKey: args.regionKey,
    });
  },
});

export const listByProperty = query({
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
      .query("marketDataSnapshots")
      .withIndex("by_property", (queryBuilder) => queryBuilder.eq("propertyId", args.propertyId))
      .collect();
  },
});
