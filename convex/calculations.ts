import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireIdentity } from "./auth";
import { assertFeature, getPlanTier, isFeatureAllowed } from "./plan";
import { calcKpiSummary, calcMonthlyCashflow } from "../src/lib/calculations/kpis";
import { calcOperatingCosts, calcRent } from "../src/lib/calculations/core";
import { calcProjection } from "../src/lib/calculations/projection";
import { calcDepreciation } from "../src/lib/calculations/depreciation";
import { buildValuationInput } from "../src/lib/calculations/valuation/fromProperty";
import { calcValuationSuite, getRegulatoryParams, pickScenario } from "../src/lib/calculations/valuation/suite";
import { calcBreakevenInterestRate } from "../src/lib/calculations/risk";
import { pickPropertyInput } from "../src/lib/domain/property";

export const getPropertyAnalysis = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    const property = await ctx.db.get(args.propertyId);

    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const propertyInput = pickPropertyInput(property);
    const rent = calcRent(propertyInput);
    const costs = calcOperatingCosts(propertyInput);
    const cashflow = calcMonthlyCashflow(propertyInput);
    const projection = calcProjection(propertyInput);
    const projectionResult = isFeatureAllowed(planTier, "projection_50y") ? projection : projection.slice(0, 10);
    const depreciation = calcDepreciation(propertyInput);
    const kpis = calcKpiSummary(propertyInput);

    return { property, rent, costs, cashflow, projection: projectionResult, depreciation, kpis };
  },
});

export const getValuationSuite = query({
  args: {
    propertyId: v.id("properties"),
    asOfDate: v.optional(v.string()),
    scenarioId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const planTier = getPlanTier(identity as unknown as Record<string, unknown>);
    assertFeature(planTier, "valuation_v2");
    if (args.scenarioId && args.scenarioId !== "base") {
      assertFeature(planTier, "scenario_analysis");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.userId !== identity.subject) {
      throw new Error("Property not found");
    }

    const snapshots = await ctx.db
      .query("marketDataSnapshots")
      .withIndex("by_property", (queryBuilder) => queryBuilder.eq("propertyId", args.propertyId))
      .collect();

    const asOfDate = args.asOfDate ?? property.valuationDate ?? new Date().toISOString().slice(0, 10);
    const scenario = pickScenario(args.scenarioId);
    const valuationInput = buildValuationInput(property, snapshots);
    const valuation = calcValuationSuite({ ...valuationInput, valuationDate: asOfDate }, scenario);

    const countryParams = await ctx.db
      .query("regulatoryParameterSets")
      .withIndex("by_country", (queryBuilder) => queryBuilder.eq("country", "DE"))
      .collect();
    const regionParams = await ctx.db
      .query("regulatoryParameterSets")
      .withIndex("by_region", (queryBuilder) => queryBuilder.eq("regionKey", property.regionKey ?? "DE"))
      .collect();
    const regulatory = getRegulatoryParams(property.regionKey ?? "DE", asOfDate, [...regionParams, ...countryParams]);

    const propertyInput = pickPropertyInput(property);
    const rent = calcRent(propertyInput);
    const costs = calcOperatingCosts(propertyInput);
    const cashflow = calcMonthlyCashflow(propertyInput);
    const projection = calcProjection(propertyInput, scenario);
    const projectionResult = isFeatureAllowed(planTier, "projection_50y") ? projection : projection.slice(0, 10);
    const kpis = calcKpiSummary(propertyInput);
    const risk = {
      breakevenInterestRate: calcBreakevenInterestRate({
        warmRent: cashflow.warmRent,
        operatingCosts: cashflow.operatingCosts,
        repayment: cashflow.repayment,
        depreciation: calcDepreciation(propertyInput).monthlyDepreciation,
        taxRate: propertyInput.personalTaxRate,
        totalDebt: propertyInput.loan1Amount + propertyInput.loan2Amount,
      }),
      vacancyReserveRate: propertyInput.vacancyMicroRisk ?? 0.03,
    };

    return {
      ertragswert: valuation.ertragswert,
      vergleichswert: valuation.vergleichswert,
      sachwert: valuation.sachwert,
      cashflow,
      projection: projectionResult,
      risk,
      assumptions: {
        ...valuation.assumptions,
        scenario: scenario.id,
        asOfDate,
        parameterSetVersion: regulatory?.version ?? "not-set",
      },
      warnings: valuation.warnings,
      marketData: snapshots,
      rent,
      costs,
      kpis,
    };
  },
});
