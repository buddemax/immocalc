import { describe, expect, it } from "vitest";
import { DEFAULT_SCENARIOS, ValuationInput } from "@/lib/domain/valuation";
import { calcErtragswert } from "@/lib/calculations/valuation/ertragswert";
import { calcVergleichswert } from "@/lib/calculations/valuation/vergleichswert";
import { calcSachwert } from "@/lib/calculations/valuation/sachwert";
import { calcValuationSuite } from "@/lib/calculations/valuation/suite";

const BASE_INPUT: ValuationInput = {
  valuationDate: "2026-02-01",
  regionKey: "DE-BE",
  livingArea: 70,
  landArea: 120,
  yearBuilt: 1998,
  remainingUsefulLife: 55,
  microLocationScore: 0.7,
  netOperatingIncomeAnnual: 10800,
  maintenanceAnnual: 1400,
  marketRentPerSqm: 13,
  capRate: 0.04,
  landValuePerSqm: 650,
  replacementCostPerSqm: 1700,
  materialFactor: 1,
  comparableSales: [
    { pricePerSqm: 4200, livingArea: 65, distanceKm: 1.2, conditionScore: 1.0, yearBuilt: 1998 },
    { pricePerSqm: 4100, livingArea: 72, distanceKm: 1.8, conditionScore: 0.95, yearBuilt: 1994 },
    { pricePerSqm: 4300, livingArea: 69, distanceKm: 2.5, conditionScore: 1.1, yearBuilt: 2002 },
    { pricePerSqm: 9000, livingArea: 75, distanceKm: 8, conditionScore: 1.2, yearBuilt: 2022 },
  ],
};

describe("valuation methods", () => {
  it("calculates ertragswert with value band", () => {
    const result = calcErtragswert(BASE_INPUT);
    expect(result.value).toBeGreaterThan(0);
    expect(result.bandHigh).toBeGreaterThan(result.value);
    expect(result.bandLow).toBeLessThan(result.value);
  });

  it("calculates vergleichswert and handles outliers", () => {
    const result = calcVergleichswert(BASE_INPUT);
    expect(result.value).toBeGreaterThan(0);
    expect(result.comparableCount).toBeLessThan(BASE_INPUT.comparableSales.length);
  });

  it("calculates sachwert with depreciation factor", () => {
    const result = calcSachwert(BASE_INPUT);
    expect(result.depreciationFactor).toBeGreaterThan(0);
    expect(result.value).toBeGreaterThan(0);
  });

  it("builds valuation suite for scenario", () => {
    const conservative = DEFAULT_SCENARIOS.find((item) => item.id === "conservative")!;
    const result = calcValuationSuite(BASE_INPUT, conservative);
    expect(result.ertragswert.value).toBeGreaterThan(0);
    expect(result.warnings).toBeDefined();
  });
});
