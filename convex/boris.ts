import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { assertFeature, getPlanTier } from "./plan";
import {
  BorisProviderConfig,
  defaultBorisProviderConfigs,
  pickProvider,
} from "../src/lib/boris/providerRegistry";

function toStateCode(regionKey: string | undefined) {
  if (!regionKey) {
    return "BB";
  }
  const parts = regionKey.split("-");
  return parts[parts.length - 1]?.toUpperCase() || "BB";
}

async function resolveProviderConfigs(ctx: any, stateCode: string): Promise<BorisProviderConfig[]> {
  const stateConfigs = (await ctx.runQuery((api as any).boris.listByState, {
    stateCode,
  })) as BorisProviderConfig[];

  if (stateConfigs.length > 0) {
    return stateConfigs as unknown as BorisProviderConfig[];
  }

  const defaults = defaultBorisProviderConfigs().filter((item) => item.stateCode === stateCode);
  if (defaults.length > 0) {
    return defaults;
  }

  return defaultBorisProviderConfigs();
}

export const seedDefaultProviders = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    const defaults = defaultBorisProviderConfigs();
    let inserted = 0;

    for (const provider of defaults) {
      const exists = await ctx.db
        .query("borisProviderConfigs")
        .withIndex("by_state", (queryBuilder) => queryBuilder.eq("stateCode", provider.stateCode))
        .first();

      if (exists) {
        continue;
      }

      await ctx.db.insert("borisProviderConfigs", provider);
      inserted += 1;
    }

    return { inserted };
  },
});

export const upsertProviderConfig = mutation({
  args: {
    id: v.optional(v.id("borisProviderConfigs")),
    stateCode: v.string(),
    providerType: v.string(),
    baseUrl: v.string(),
    collectionId: v.string(),
    enabled: v.boolean(),
    priority: v.number(),
    mappingVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    if (args.id) {
      const { id, ...patch } = args;
      await ctx.db.patch(id, patch);
      return id;
    }

    const { id: _id, ...insert } = args;
    return ctx.db.insert("borisProviderConfigs", insert);
  },
});

export const listProviderStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    const configs = await ctx.db
      .query("borisProviderConfigs")
      .withIndex("by_enabled_priority", (queryBuilder) => queryBuilder.eq("enabled", true))
      .collect();

    if (configs.length > 0) {
      return configs;
    }

    return defaultBorisProviderConfigs();
  },
});

export const listByState = query({
  args: {
    stateCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return ctx.db
      .query("borisProviderConfigs")
      .withIndex("by_state", (queryBuilder) => queryBuilder.eq("stateCode", args.stateCode))
      .collect();
  },
});

export const previewQuery = action({
  args: {
    stateCode: v.string(),
    lat: v.float64(),
    lon: v.float64(),
    asOfDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    const configs = await resolveProviderConfigs(ctx, args.stateCode.toUpperCase());
    const provider = pickProvider(args.stateCode.toUpperCase(), configs);

    if (!provider) {
      return null;
    }

    return provider.fetchLandValue({
      stateCode: args.stateCode.toUpperCase(),
      lat: args.lat,
      lon: args.lon,
      asOfDate: args.asOfDate,
    });
  },
});

export const syncLandValue = action({
  args: {
    propertyId: v.id("properties"),
    asOfDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    const property = await ctx.runQuery((api as any).properties.byId, { id: args.propertyId });
    if (!property) {
      throw new Error("Property not found");
    }

    const lat = Number(property.latitude ?? 0);
    const lon = Number(property.longitude ?? 0);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
      throw new Error("Property has no coordinates");
    }

    const stateCode = toStateCode(property.regionKey);
    const asOfDate = args.asOfDate ?? property.valuationDate ?? new Date().toISOString().slice(0, 10);

    const configs = await resolveProviderConfigs(ctx, stateCode);
    const provider = pickProvider(stateCode, configs);
    if (!provider) {
      throw new Error(`No BORIS provider configured for state ${stateCode}`);
    }

    const normalized = await provider.fetchLandValue({
      stateCode,
      lat,
      lon,
      asOfDate,
    });

    if (!normalized) {
      throw new Error("BORIS query returned no usable land value");
    }

    await ctx.runMutation((api as any).marketData.upsertFromApi, {
      propertyId: args.propertyId,
      metric: "land_value_per_sqm",
      value: normalized.valueEurPerSqm,
      unit: "eur_per_sqm",
      sourceType: "api_boris",
      sourceLabel: `BORIS ${stateCode}`,
      sourceUrl: normalized.sourceUrl,
      effectiveDate: normalized.effectiveDate,
      confidence: normalized.confidence,
      regionKey: property.regionKey ?? `DE-${stateCode}`,
    });

    return normalized;
  },
});
