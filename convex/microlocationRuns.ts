import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

const populationClass = v.union(
  v.literal("metropole"),
  v.literal("grossstadt"),
  v.literal("mittelstadt"),
  v.literal("kleinstadt"),
  v.literal("dorf"),
  v.literal("unknown"),
);

export const insertRun = internalMutation({
  args: {
    userId: v.string(),
    propertyId: v.id("properties"),
    runAt: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    inputSnapshot: v.object({
      address: v.string(),
      lat: v.optional(v.float64()),
      lon: v.optional(v.float64()),
      radiusPrimary: v.float64(),
      radiusSecondary: v.float64(),
      countryCode: v.string(),
    }),
    dataSnapshot: v.optional(
      v.object({
        populationValue: v.optional(v.float64()),
        populationClass,
        poiSummary: v.object({
          supermarketsCount: v.float64(),
          nearestSupermarketMeters: v.optional(v.float64()),
          transitCount: v.float64(),
          nearestTransitMeters: v.optional(v.float64()),
          schoolsCount: v.float64(),
          nearestSchoolMeters: v.optional(v.float64()),
          parksCount: v.float64(),
          nearestParkMeters: v.optional(v.float64()),
        }),
        sourceMeta: v.object({
          geocodeProvider: v.string(),
          poiProvider: v.string(),
          populationSource: v.string(),
        }),
      }),
    ),
    llmOutput: v.optional(v.string()),
    result: v.optional(
      v.object({
        scoreOepnv: v.float64(),
        scoreEinkauf: v.float64(),
        scoreBildung: v.float64(),
        scoreFreizeit: v.float64(),
        gesamtScore: v.float64(),
        kurzbegruendung: v.string(),
        confidence: v.float64(),
      }),
    ),
    errorMessage: v.optional(v.string()),
    providerMeta: v.optional(
      v.object({
        fastApiUrl: v.string(),
        model: v.optional(v.string()),
      }),
    ),
    durationMs: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("microLocationRuns", args);
  },
});
