"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { assertFeature, getPlanTier } from "./plan";
import { buildGeoCacheKey, isCacheValid, ttlIso } from "../src/lib/geo/cache";
import { nominatimReverse, nominatimSearchAddress } from "../src/lib/geo/nominatimClient";
import { fetchPoiInsights as fetchOverpassPoiInsights } from "../src/lib/geo/overpassClient";
import { waitForRateLimit } from "../src/lib/geo/rateLimit";

function deriveRegionKey(countryCode: string, state: string) {
  if (countryCode !== "DE") {
    return countryCode || "DE";
  }

  const map: Record<string, string> = {
    berlin: "DE-BE",
    brandenburg: "DE-BB",
    hamburg: "DE-HH",
    bayern: "DE-BY",
    sachsen: "DE-SN",
  };
  const normalized = state.trim().toLowerCase();
  return map[normalized] ?? "DE";
}

function parseCachedPayload<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

async function readCache(
  ctx: any,
  userId: string,
  cacheKey: string,
): Promise<{ status: "ok" | "error"; payload: string; expiresAt: string } | null> {
  const entry = (await ctx.runQuery((internal as any).geoCache.getByKey, {
    userId,
    cacheKey,
  })) as
    | {
        status: "ok" | "error";
        payload: string;
        expiresAt: string;
      }
    | null;

  if (!entry || !isCacheValid(entry.expiresAt)) {
    return null;
  }

  return entry;
}

async function writeCache(
  ctx: any,
  userId: string,
  input: {
    cacheKey: string;
    provider: string;
    requestType: string;
    payload: string;
    status: "ok" | "error";
    expiresDays: number;
    error?: string;
  },
) {
  await ctx.runMutation((internal as any).geoCache.upsert, {
    userId,
    cacheKey: input.cacheKey,
    provider: input.provider,
    requestType: input.requestType,
    payload: input.payload,
    status: input.status,
    fetchedAt: new Date().toISOString(),
    expiresAt: ttlIso(input.expiresDays),
    error: input.error,
  });
}

export const previewAddress = action({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "geo_boris_v1");

    const cacheKey = buildGeoCacheKey({ type: "nominatim-search", address: args.address });
    const cached = await readCache(ctx, identity.subject, cacheKey);
    if (cached?.status === "ok") {
      return parseCachedPayload<Record<string, unknown>>(cached.payload);
    }

    await waitForRateLimit("nominatim-search", 1200);

    const result = await nominatimSearchAddress(args.address);
    const payload = JSON.stringify(result);
    await writeCache(ctx, identity.subject, {
      cacheKey,
      provider: "nominatim",
      requestType: "search",
      payload,
      status: "ok",
      expiresDays: 30,
    });

    return result;
  },
});

export const resolveAddress = action({
  args: {
    propertyId: v.id("properties"),
    address: v.string(),
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

    const cacheKey = buildGeoCacheKey({ type: "nominatim-search", address: args.address });
    const cached = await readCache(ctx, identity.subject, cacheKey);
    let result = cached?.status === "ok" ? parseCachedPayload<Awaited<ReturnType<typeof nominatimSearchAddress>>>(cached.payload) : null;

    if (!result) {
      await waitForRateLimit("nominatim-search", 1200);
      result = await nominatimSearchAddress(args.address);
      await writeCache(ctx, identity.subject, {
        cacheKey,
        provider: "nominatim",
        requestType: "search",
        payload: JSON.stringify(result),
        status: "ok",
        expiresDays: 30,
      });
    }

    if (!result) {
      throw new Error("Address could not be resolved");
    }

    const regionKey = deriveRegionKey(result.countryCode, result.state ?? "");
    await ctx.runMutation((api as any).properties.update, {
      id: args.propertyId,
      latitude: result.point.lat,
      longitude: result.point.lon,
      geoConfidence: result.confidence,
      geoResolvedAt: new Date().toISOString(),
      adminCountryCode: result.countryCode,
      adminState: result.state ?? "",
      adminCounty: result.county ?? "",
      adminCity: result.city ?? "",
      osmPlaceId: result.osmPlaceId,
      displayName: result.displayName,
      regionKey,
    });

    return result;
  },
});

export const fetchBoundary = action({
  args: {
    propertyId: v.id("properties"),
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

    const cacheKey = buildGeoCacheKey({ type: "nominatim-reverse", lat: lat.toFixed(5), lon: lon.toFixed(5) });
    const cached = await readCache(ctx, identity.subject, cacheKey);

    let boundary =
      cached?.status === "ok"
        ? parseCachedPayload<Awaited<ReturnType<typeof nominatimReverse>>>(cached.payload)
        : null;

    if (!boundary) {
      await waitForRateLimit("nominatim-reverse", 1200);
      boundary = await nominatimReverse({ lat, lon });
      await writeCache(ctx, identity.subject, {
        cacheKey,
        provider: "nominatim",
        requestType: "reverse",
        payload: JSON.stringify(boundary),
        status: "ok",
        expiresDays: 30,
      });
    }

    if (!boundary) {
      throw new Error("Boundary could not be resolved");
    }

    await ctx.runMutation((api as any).properties.update, {
      id: args.propertyId,
      boundaryGeoJson: boundary.geoJson,
      displayName: boundary.geocode.displayName,
      adminState: boundary.geocode.state ?? property.adminState ?? "",
      adminCounty: boundary.geocode.county ?? property.adminCounty ?? "",
      adminCity: boundary.geocode.city ?? property.adminCity ?? "",
      adminCountryCode: boundary.geocode.countryCode,
    });

    return boundary;
  },
});

export const fetchPoiInsights = action({
  args: {
    propertyId: v.id("properties"),
    radiusMeters: v.optional(v.float64()),
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

    const radius = Math.max(200, Math.min(3000, Math.round(args.radiusMeters ?? 1000)));
    const cacheKey = buildGeoCacheKey({ type: "overpass-poi", lat: lat.toFixed(4), lon: lon.toFixed(4), radius });
    const cached = await readCache(ctx, identity.subject, cacheKey);

    let insights =
      cached?.status === "ok"
        ? parseCachedPayload<Awaited<ReturnType<typeof fetchOverpassPoiInsights>>>(cached.payload)
        : null;

    if (!insights) {
      await waitForRateLimit("overpass", 1500);
      insights = await fetchOverpassPoiInsights({ lat, lon }, radius);
      await writeCache(ctx, identity.subject, {
        cacheKey,
        provider: "overpass",
        requestType: "poi",
        payload: JSON.stringify(insights),
        status: "ok",
        expiresDays: 7,
      });
    }

    if (!insights) {
      throw new Error("POI insights unavailable");
    }

    const effectiveDate = new Date().toISOString().slice(0, 10);
    const regionKey = typeof property.regionKey === "string" && property.regionKey.length > 0 ? property.regionKey : "DE";

    for (const insight of insights) {
      if (insight.key === "supermarket") {
        await ctx.runMutation((api as any).marketData.upsertFromApi, {
          propertyId: args.propertyId,
          metric: "poi_supermarket_1km",
          value: insight.count1km ?? 0,
          unit: "factor",
          sourceType: "api_geo",
          sourceLabel: "Overpass POI",
          sourceUrl: "https://overpass-api.de/api/interpreter",
          effectiveDate,
          confidence: 0.6,
          regionKey,
        });
      }
      if (insight.key === "school") {
        await ctx.runMutation((api as any).marketData.upsertFromApi, {
          propertyId: args.propertyId,
          metric: "poi_school_1km",
          value: insight.count1km ?? 0,
          unit: "factor",
          sourceType: "api_geo",
          sourceLabel: "Overpass POI",
          sourceUrl: "https://overpass-api.de/api/interpreter",
          effectiveDate,
          confidence: 0.6,
          regionKey,
        });
      }
      if (insight.key === "transit") {
        await ctx.runMutation((api as any).marketData.upsertFromApi, {
          propertyId: args.propertyId,
          metric: "poi_transit_1km",
          value: insight.count1km ?? 0,
          unit: "factor",
          sourceType: "api_geo",
          sourceLabel: "Overpass POI",
          sourceUrl: "https://overpass-api.de/api/interpreter",
          effectiveDate,
          confidence: 0.6,
          regionKey,
        });

        if (typeof insight.nearestDistanceMeters === "number") {
          await ctx.runMutation((api as any).marketData.upsertFromApi, {
            propertyId: args.propertyId,
            metric: "distance_transit_m",
            value: insight.nearestDistanceMeters,
            unit: "meters",
            sourceType: "api_geo",
            sourceLabel: "Overpass POI",
            sourceUrl: "https://overpass-api.de/api/interpreter",
            effectiveDate,
            confidence: 0.6,
            regionKey,
          });
        }
      }
    }

    return insights;
  },
});
