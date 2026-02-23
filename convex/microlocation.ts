import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier } from "./plan";
import type { MicroLocationEvaluateResult } from "../src/lib/domain/microlocation";

const DEFAULT_RADIUS_PRIMARY = 500;
const DEFAULT_RADIUS_SECONDARY = 1000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function toNonNegativeInteger(value: unknown): number {
  const parsed = toFiniteNumber(value);
  if (parsed === undefined) {
    return 0;
  }
  return Math.max(0, Math.round(parsed));
}

function parseResult(payload: unknown): MicroLocationEvaluateResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Ungültige Antwort vom Mikrolage-Service.");
  }

  const row = payload as Record<string, unknown>;
  const scoreOepnv = toFiniteNumber(row.score_oepnv);
  const scoreEinkauf = toFiniteNumber(row.score_einkauf);
  const scoreBildung = toFiniteNumber(row.score_bildung);
  const scoreFreizeit = toFiniteNumber(row.score_freizeit);
  const gesamtScore = toFiniteNumber(row.gesamt_score);
  const confidence = toFiniteNumber(row.confidence);
  const kurzbegruendung = typeof row.kurzbegruendung === "string" ? row.kurzbegruendung : "";

  if (
    scoreOepnv === undefined ||
    scoreEinkauf === undefined ||
    scoreBildung === undefined ||
    scoreFreizeit === undefined ||
    gesamtScore === undefined
  ) {
    throw new Error("Mikrolage-Service lieferte ungültige Scores.");
  }

  const scores = [scoreOepnv, scoreEinkauf, scoreBildung, scoreFreizeit, gesamtScore];
  if (scores.some((score) => score < 1 || score > 10)) {
    throw new Error("Mikrolage-Service lieferte ungültige Scores.");
  }

  const poi = (row.poi_summary as Record<string, unknown> | undefined) ?? {};
  const sourceMeta = (row.source_meta as Record<string, unknown> | undefined) ?? {};

  return {
    scoreOepnv,
    scoreEinkauf,
    scoreBildung,
    scoreFreizeit,
    gesamtScore,
    kurzbegruendung,
    confidence: clamp(confidence ?? 0.5, 0, 1),
    populationValue: toFiniteNumber(row.population_value),
    populationClass:
      typeof row.population_class === "string" &&
      ["metropole", "grossstadt", "mittelstadt", "kleinstadt", "dorf", "unknown"].includes(row.population_class)
        ? (row.population_class as MicroLocationEvaluateResult["populationClass"])
        : "unknown",
    poiSummary: {
      supermarketsCount: toNonNegativeInteger(poi.supermarkets_count),
      nearestSupermarketMeters: toFiniteNumber(poi.nearest_supermarket_meters),
      transitCount: toNonNegativeInteger(poi.transit_count),
      nearestTransitMeters: toFiniteNumber(poi.nearest_transit_meters),
      schoolsCount: toNonNegativeInteger(poi.schools_count),
      nearestSchoolMeters: toFiniteNumber(poi.nearest_school_meters),
      parksCount: toNonNegativeInteger(poi.parks_count),
      nearestParkMeters: toFiniteNumber(poi.nearest_park_meters),
    },
    sourceMeta: {
      geocodeProvider: typeof sourceMeta.geocode_provider === "string" ? sourceMeta.geocode_provider : "nominatim",
      poiProvider: typeof sourceMeta.poi_provider === "string" ? sourceMeta.poi_provider : "overpass",
      populationSource: typeof sourceMeta.population_source === "string" ? sourceMeta.population_source : "osm_unknown",
    },
    providerMeta: {
      model: typeof row.model === "string" ? row.model : undefined,
    },
  };
}

export const runAutoScore = action({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "micro_location_auto_v1");

    const property = (await ctx.runQuery("properties:byId" as never, { id: args.propertyId as never } as never)) as Record<
      string,
      unknown
    > | null;
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const fastApiBaseUrl = process.env.MICROLOCATION_FASTAPI_URL;
    const serviceToken = process.env.MICROLOCATION_SERVICE_TOKEN;
    const evaluatePath = process.env.MICROLOCATION_FASTAPI_EVALUATE_PATH || "/v1/microlocation/evaluate";
    if (!fastApiBaseUrl || !serviceToken) {
      throw new Error("Mikrolage-Service ist nicht konfiguriert.");
    }
    const normalizedEvaluatePath = evaluatePath.startsWith("/") ? evaluatePath : `/${evaluatePath}`;

    const start = Date.now();
    const runAt = new Date().toISOString();
    const lat = toFiniteNumber(property.latitude);
    const lon = toFiniteNumber(property.longitude);
    const address = typeof property.address === "string" ? property.address : "";
    const countryCode =
      typeof property.adminCountryCode === "string" && property.adminCountryCode.length > 0
        ? property.adminCountryCode
        : "DE";

    const inputSnapshot = {
      address,
      lat,
      lon,
      radiusPrimary: DEFAULT_RADIUS_PRIMARY,
      radiusSecondary: DEFAULT_RADIUS_SECONDARY,
      countryCode,
    };

    let runId: string | null = null;
    try {
      if (!address) {
        throw new Error("Adresse fehlt für die Mikrolage-Bewertung.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const response = await (async () => {
        try {
          return await fetch(`${fastApiBaseUrl.replace(/\/$/, "")}${normalizedEvaluatePath}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceToken}`,
            },
            body: JSON.stringify({
              schemaVersion: "v1",
              address,
              lat,
              lon,
              radiusPrimary: DEFAULT_RADIUS_PRIMARY,
              radiusSecondary: DEFAULT_RADIUS_SECONDARY,
              countryCode,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
      })();

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Mikrolage-Service Fehler (${response.status}): ${text}`);
      }

      const rawPayload = (await response.json()) as unknown;
      const result = parseResult(rawPayload);
      const durationMs = Date.now() - start;

      runId = await ctx.runMutation("microlocationRuns:insertRun" as never, {
        userId: identity.subject,
        propertyId: args.propertyId,
        runAt,
        status: "success",
        inputSnapshot,
        dataSnapshot: {
          populationValue: result.populationValue,
          populationClass: result.populationClass,
          poiSummary: result.poiSummary,
          sourceMeta: result.sourceMeta,
        },
        llmOutput: JSON.stringify(rawPayload),
        result: {
          scoreOepnv: result.scoreOepnv,
          scoreEinkauf: result.scoreEinkauf,
          scoreBildung: result.scoreBildung,
          scoreFreizeit: result.scoreFreizeit,
          gesamtScore: result.gesamtScore,
          kurzbegruendung: result.kurzbegruendung,
          confidence: result.confidence,
        },
        providerMeta: {
          fastApiUrl: fastApiBaseUrl,
          model: result.providerMeta?.model,
        },
        durationMs,
      } as never);

      await ctx.runMutation("properties:update" as never, {
        id: args.propertyId,
        microLocationScore: clamp(result.gesamtScore / 10, 0, 1),
        microLocationSource: "auto",
        microLocationUpdatedAt: runAt,
        microLocationConfidence: result.confidence,
        microLocationBreakdown: {
          scoreOepnv: result.scoreOepnv,
          scoreEinkauf: result.scoreEinkauf,
          scoreBildung: result.scoreBildung,
          scoreFreizeit: result.scoreFreizeit,
          gesamtScore: result.gesamtScore,
          kurzbegruendung: result.kurzbegruendung,
        },
        microLocationLastRunId: runId as never,
      } as never);

      return {
        runId,
        result,
        normalizedScore: clamp(result.gesamtScore / 10, 0, 1),
      };
    } catch (error) {
      const durationMs = Date.now() - start;
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      await ctx.runMutation("microlocationRuns:insertRun" as never, {
        userId: identity.subject,
        propertyId: args.propertyId,
        runAt,
        status: "error",
        inputSnapshot,
        errorMessage: message,
        providerMeta: {
          fastApiUrl: fastApiBaseUrl,
        },
        durationMs,
      } as never);
      throw new Error("Bewertung konnte nicht durchgeführt werden. Du kannst mit dem Default-Wert weiterrechnen oder manuell setzen.");
    }
  },
});

export const listRuns = query({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const rows = await ctx.db
      .query("microLocationRuns")
      .withIndex("by_property", (queryBuilder) => queryBuilder.eq("propertyId", args.propertyId))
      .collect();
    return rows.sort((a, b) => (a.runAt < b.runAt ? 1 : -1));
  },
});

export const setManualScore = mutation({
  args: {
    propertyId: v.id("properties"),
    score: v.float64(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const score = clamp(args.score, 1, 10);
    const runAt = new Date().toISOString();

    const runId = await ctx.db.insert("microLocationRuns", {
      userId: identity.subject,
      propertyId: args.propertyId,
      runAt,
      status: "success",
      inputSnapshot: {
        address: property.address,
        lat: toFiniteNumber(property.latitude),
        lon: toFiniteNumber(property.longitude),
        radiusPrimary: DEFAULT_RADIUS_PRIMARY,
        radiusSecondary: DEFAULT_RADIUS_SECONDARY,
        countryCode: property.adminCountryCode || "DE",
      },
      dataSnapshot: {
        populationValue: undefined,
        populationClass: "unknown",
        poiSummary: {
          supermarketsCount: 0,
          transitCount: 0,
          schoolsCount: 0,
          parksCount: 0,
        },
        sourceMeta: {
          geocodeProvider: "manual",
          poiProvider: "manual",
          populationSource: "manual",
        },
      },
      llmOutput: undefined,
      result: {
        scoreOepnv: score,
        scoreEinkauf: score,
        scoreBildung: score,
        scoreFreizeit: score,
        gesamtScore: score,
        kurzbegruendung: args.reason || "Manuell gesetzt.",
        confidence: 1,
      },
      providerMeta: {
        fastApiUrl: "manual",
      },
      durationMs: 0,
    });

    await ctx.db.patch(args.propertyId, {
      microLocationScore: score / 10,
      microLocationSource: "manual",
      microLocationUpdatedAt: runAt,
      microLocationConfidence: 1,
      microLocationBreakdown: {
        scoreOepnv: score,
        scoreEinkauf: score,
        scoreBildung: score,
        scoreFreizeit: score,
        gesamtScore: score,
        kurzbegruendung: args.reason || "Manuell gesetzt.",
      },
      microLocationLastRunId: runId,
    });

    return { runId, normalizedScore: score / 10 };
  },
});
