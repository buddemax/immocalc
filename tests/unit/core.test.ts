import { describe, expect, it } from "vitest";
import { DEFAULT_PROPERTY } from "@/lib/domain/property";
import {
  calc15PercentLimit,
  calcOperatingCosts,
  calcPurchaseCosts,
  calcRent,
  calcTotalInvestment,
} from "@/lib/calculations/core";

describe("core calculations", () => {
  it("calculates purchase costs", () => {
    const result = calcPurchaseCosts(DEFAULT_PROPERTY);
    expect(result.totalAmount).toBeGreaterThan(0);
    expect(result.totalPercent).toBeCloseTo(0.1207, 4);
  });

  it("calculates total investment including initial investments", () => {
    const property = {
      ...DEFAULT_PROPERTY,
      initialInvestments: [{ name: "Küche", cost: 6000, taxTreatment: "activate" as const, valueIncrease: 3000 }],
    };
    const result = calcTotalInvestment(property);
    expect(result).toBeGreaterThan(property.purchasePrice);
  });

  it("calculates rent and operating costs", () => {
    const rent = calcRent(DEFAULT_PROPERTY);
    const costs = calcOperatingCosts(DEFAULT_PROPERTY);
    expect(rent.warmRent).toBeGreaterThan(rent.netColdRent);
    expect(costs.total).toBeGreaterThan(costs.transferable);
  });

  it("calculates 15% limit", () => {
    const result = calc15PercentLimit(DEFAULT_PROPERTY);
    expect(result).toBeGreaterThan(0);
  });
});
