import { describe, expect, it } from "vitest";
import { calcMarginalTaxRate, calcMonthlyTax } from "@/lib/calculations/tax";

describe("tax calculations", () => {
  it("returns positive marginal tax rates for mid/high income", () => {
    expect(calcMarginalTaxRate(70000, "single", false)).toBeGreaterThan(0);
    expect(calcMarginalTaxRate(120000, "joint", true)).toBeGreaterThan(0);
  });

  it("calculates monthly tax base", () => {
    const result = calcMonthlyTax({
      warmRent: 1000,
      operatingCostsWithoutOwnReserve: 300,
      monthlyInterest: 250,
      monthlyDepreciation: 150,
      marginalTaxRate: 0.42,
    });

    expect(result.taxableIncome).toBe(300);
    expect(result.monthlyTax).toBeCloseTo(126, 1);
  });
});
