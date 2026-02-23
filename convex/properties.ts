import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { propertyFields } from "./schema";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier } from "./plan";

const propertyArgs = {
  address: propertyFields.address,
  purchaseDate: propertyFields.purchaseDate,
  valuationDate: propertyFields.valuationDate,
  propertyType: propertyFields.propertyType,
  regionKey: propertyFields.regionKey,
  microLocationScore: propertyFields.microLocationScore,
  microLocationSource: propertyFields.microLocationSource,
  microLocationUpdatedAt: propertyFields.microLocationUpdatedAt,
  microLocationConfidence: propertyFields.microLocationConfidence,
  microLocationBreakdown: propertyFields.microLocationBreakdown,
  microLocationLastRunId: propertyFields.microLocationLastRunId,
  livingArea: propertyFields.livingArea,
  landArea: propertyFields.landArea,
  parkingSpaces: propertyFields.parkingSpaces,
  yearBuilt: propertyFields.yearBuilt,
  modernizationYear: propertyFields.modernizationYear,
  remainingUsefulLife: propertyFields.remainingUsefulLife,
  energyClass: propertyFields.energyClass,
  heatingType: propertyFields.heatingType,
  co2CostSplitLandlord: propertyFields.co2CostSplitLandlord,
  rentLevelClass: propertyFields.rentLevelClass,
  vacancyMicroRisk: propertyFields.vacancyMicroRisk,
  latitude: propertyFields.latitude,
  longitude: propertyFields.longitude,
  geoConfidence: propertyFields.geoConfidence,
  geoResolvedAt: propertyFields.geoResolvedAt,
  adminCountryCode: propertyFields.adminCountryCode,
  adminState: propertyFields.adminState,
  adminCounty: propertyFields.adminCounty,
  adminCity: propertyFields.adminCity,
  osmPlaceId: propertyFields.osmPlaceId,
  displayName: propertyFields.displayName,
  boundaryGeoJson: propertyFields.boundaryGeoJson,
  shortCode: propertyFields.shortCode,
  purchasePrice: propertyFields.purchasePrice,
  brokerFeePercent: propertyFields.brokerFeePercent,
  notaryFeePercent: propertyFields.notaryFeePercent,
  landRegistryPercent: propertyFields.landRegistryPercent,
  transferTaxPercent: propertyFields.transferTaxPercent,
  otherCostsPercent: propertyFields.otherCostsPercent,
  initialInvestments: propertyFields.initialInvestments,
  coldRentPerSqm: propertyFields.coldRentPerSqm,
  parkingRent: propertyFields.parkingRent,
  otherRent: propertyFields.otherRent,
  transferableCosts: propertyFields.transferableCosts,
  hausgeldTotal: propertyFields.hausgeldTotal,
  hausgeldTransferable: propertyFields.hausgeldTransferable,
  wegReserve: propertyFields.wegReserve,
  propertyTax: propertyFields.propertyTax,
  otherOperatingCosts: propertyFields.otherOperatingCosts,
  vacancyReservePercent: propertyFields.vacancyReservePercent,
  maintenanceReservePerSqm: propertyFields.maintenanceReservePerSqm,
  depreciationRate: propertyFields.depreciationRate,
  buildingSharePercent: propertyFields.buildingSharePercent,
  personalTaxRate: propertyFields.personalTaxRate,
  loan1Amount: propertyFields.loan1Amount,
  loan1InterestRate: propertyFields.loan1InterestRate,
  loan1InitialRepayment: propertyFields.loan1InitialRepayment,
  loan1InterestChanges: propertyFields.loan1InterestChanges,
  loan1RepaymentChanges: propertyFields.loan1RepaymentChanges,
  loan1SpecialRepayments: propertyFields.loan1SpecialRepayments,
  loan2Amount: propertyFields.loan2Amount,
  loan2InterestRate: propertyFields.loan2InterestRate,
  loan2InitialRepayment: propertyFields.loan2InitialRepayment,
  loan2InterestChanges: propertyFields.loan2InterestChanges,
  loan2RepaymentChanges: propertyFields.loan2RepaymentChanges,
  loan2SpecialRepayments: propertyFields.loan2SpecialRepayments,
  costIncreasePercent: propertyFields.costIncreasePercent,
  rentIncreasePercent: propertyFields.rentIncreasePercent,
  valueIncreasePercent: propertyFields.valueIncreasePercent,
  projectionYear: propertyFields.projectionYear,
};

const optionalPropertyArgs = Object.fromEntries(
  Object.entries(propertyArgs).map(([key, validator]) => [key, v.optional(validator as never)]),
) as Record<string, unknown>;

export const create = mutation({
  args: propertyArgs,
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    const today = new Date().toISOString().slice(0, 10);

    if (args.loan2Amount > 0 || args.loan2InterestRate > 0 || args.loan2InitialRepayment > 0) {
      assertFeature(planTier, "second_loan");
    }

    if ((args.loan1InterestChanges?.length ?? 0) > 0 || (args.loan2InterestChanges?.length ?? 0) > 0) {
      assertFeature(planTier, "loan_changes");
    }

    if ((args.loan1SpecialRepayments?.length ?? 0) > 0 || (args.loan2SpecialRepayments?.length ?? 0) > 0) {
      assertFeature(planTier, "special_repayments");
    }

    return ctx.db.insert("properties", {
      userId: identity.subject,
      ...args,
      valuationDate: args.valuationDate ?? today,
      propertyType: args.propertyType ?? "apartment",
      regionKey: args.regionKey ?? "DE-BE",
      microLocationScore: args.microLocationScore ?? 0.65,
      microLocationSource: args.microLocationSource ?? "default",
      microLocationUpdatedAt: args.microLocationUpdatedAt ?? "",
      microLocationConfidence: args.microLocationConfidence ?? 0,
      microLocationBreakdown: args.microLocationBreakdown,
      microLocationLastRunId: args.microLocationLastRunId,
      landArea: args.landArea ?? 0,
      yearBuilt: args.yearBuilt ?? 1995,
      remainingUsefulLife: args.remainingUsefulLife ?? 50,
      energyClass: args.energyClass ?? "D",
      heatingType: args.heatingType ?? "gas",
      co2CostSplitLandlord: args.co2CostSplitLandlord ?? 0.5,
      rentLevelClass: args.rentLevelClass ?? "mittel",
      vacancyMicroRisk: args.vacancyMicroRisk ?? 0.03,
      latitude: args.latitude ?? 0,
      longitude: args.longitude ?? 0,
      geoConfidence: args.geoConfidence ?? 0,
      geoResolvedAt: args.geoResolvedAt ?? "",
      adminCountryCode: args.adminCountryCode ?? "DE",
      adminState: args.adminState ?? "",
      adminCounty: args.adminCounty ?? "",
      adminCity: args.adminCity ?? "",
      osmPlaceId: args.osmPlaceId ?? "",
      displayName: args.displayName ?? "",
      boundaryGeoJson: args.boundaryGeoJson ?? "",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("properties"),
    ...(optionalPropertyArgs as Record<string, never>),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    const existing = await ctx.db.get(args.id);

    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const { id, ...patch } = args;
    const updates = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));

    if (
      ("loan2Amount" in updates && Number(updates.loan2Amount) > 0) ||
      ("loan2InterestRate" in updates && Number(updates.loan2InterestRate) > 0) ||
      ("loan2InitialRepayment" in updates && Number(updates.loan2InitialRepayment) > 0)
    ) {
      assertFeature(planTier, "second_loan");
    }

    if (
      ("loan1InterestChanges" in updates && Array.isArray(updates.loan1InterestChanges) && updates.loan1InterestChanges.length > 0) ||
      ("loan2InterestChanges" in updates && Array.isArray(updates.loan2InterestChanges) && updates.loan2InterestChanges.length > 0)
    ) {
      assertFeature(planTier, "loan_changes");
    }

    if (
      ("loan1SpecialRepayments" in updates &&
        Array.isArray(updates.loan1SpecialRepayments) &&
        updates.loan1SpecialRepayments.length > 0) ||
      ("loan2SpecialRepayments" in updates &&
        Array.isArray(updates.loan2SpecialRepayments) &&
        updates.loan2SpecialRepayments.length > 0)
    ) {
      assertFeature(planTier, "special_repayments");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return ctx.db
      .query("properties")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .collect();
  },
});

export const byId = query({
  args: {
    id: v.id("properties"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const property = await ctx.db.get(args.id);

    if (!property || property.userId !== identity.subject) {
      return null;
    }

    return property;
  },
});

export const upsertValuationInputs = mutation({
  args: {
    id: v.id("properties"),
    valuationDate: v.optional(propertyFields.valuationDate),
    propertyType: v.optional(propertyFields.propertyType),
    regionKey: v.optional(propertyFields.regionKey),
    microLocationScore: v.optional(propertyFields.microLocationScore),
    microLocationSource: v.optional(propertyFields.microLocationSource),
    microLocationUpdatedAt: v.optional(propertyFields.microLocationUpdatedAt),
    microLocationConfidence: v.optional(propertyFields.microLocationConfidence),
    microLocationBreakdown: v.optional(propertyFields.microLocationBreakdown),
    microLocationLastRunId: v.optional(propertyFields.microLocationLastRunId),
    landArea: v.optional(propertyFields.landArea),
    yearBuilt: v.optional(propertyFields.yearBuilt),
    modernizationYear: v.optional(propertyFields.modernizationYear),
    remainingUsefulLife: v.optional(propertyFields.remainingUsefulLife),
    energyClass: v.optional(propertyFields.energyClass),
    heatingType: v.optional(propertyFields.heatingType),
    co2CostSplitLandlord: v.optional(propertyFields.co2CostSplitLandlord),
    rentLevelClass: v.optional(propertyFields.rentLevelClass),
    vacancyMicroRisk: v.optional(propertyFields.vacancyMicroRisk),
    latitude: v.optional(propertyFields.latitude),
    longitude: v.optional(propertyFields.longitude),
    geoConfidence: v.optional(propertyFields.geoConfidence),
    geoResolvedAt: v.optional(propertyFields.geoResolvedAt),
    adminCountryCode: v.optional(propertyFields.adminCountryCode),
    adminState: v.optional(propertyFields.adminState),
    adminCounty: v.optional(propertyFields.adminCounty),
    adminCity: v.optional(propertyFields.adminCity),
    osmPlaceId: v.optional(propertyFields.osmPlaceId),
    displayName: v.optional(propertyFields.displayName),
    boundaryGeoJson: v.optional(propertyFields.boundaryGeoJson),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db.get(args.id);

    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const { id, ...patch } = args;
    const updates = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    if ("microLocationScore" in updates) {
      updates.microLocationSource = "manual";
      updates.microLocationUpdatedAt = new Date().toISOString();
    }
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const migrateValuationDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .collect();

    const today = new Date().toISOString().slice(0, 10);
    let patched = 0;

    for (const property of properties) {
      const patch: Record<string, unknown> = {};

      if (!property.valuationDate) patch.valuationDate = today;
      if (!property.propertyType) patch.propertyType = "apartment";
      if (!property.regionKey) patch.regionKey = "DE-BE";
      if (typeof property.microLocationScore !== "number") patch.microLocationScore = 0.65;
      if (!property.microLocationSource) patch.microLocationSource = "default";
      if (typeof property.microLocationConfidence !== "number") patch.microLocationConfidence = 0;
      if (!property.microLocationUpdatedAt) patch.microLocationUpdatedAt = "";
      if (typeof property.landArea !== "number") patch.landArea = 0;
      if (typeof property.yearBuilt !== "number") patch.yearBuilt = 1995;
      if (typeof property.remainingUsefulLife !== "number") patch.remainingUsefulLife = 50;
      if (!property.energyClass) patch.energyClass = "D";
      if (!property.heatingType) patch.heatingType = "gas";
      if (typeof property.co2CostSplitLandlord !== "number") patch.co2CostSplitLandlord = 0.5;
      if (!property.rentLevelClass) patch.rentLevelClass = "mittel";
      if (typeof property.vacancyMicroRisk !== "number") patch.vacancyMicroRisk = 0.03;
      if (typeof property.latitude !== "number") patch.latitude = 0;
      if (typeof property.longitude !== "number") patch.longitude = 0;
      if (typeof property.geoConfidence !== "number") patch.geoConfidence = 0;
      if (!property.geoResolvedAt) patch.geoResolvedAt = "";
      if (!property.adminCountryCode) patch.adminCountryCode = "DE";
      if (!property.adminState) patch.adminState = "";
      if (!property.adminCounty) patch.adminCounty = "";
      if (!property.adminCity) patch.adminCity = "";
      if (!property.osmPlaceId) patch.osmPlaceId = "";
      if (!property.displayName) patch.displayName = "";
      if (!property.boundaryGeoJson) patch.boundaryGeoJson = "";

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(property._id, patch);
        patched += 1;
      }
    }

    return { patched, total: properties.length };
  },
});
