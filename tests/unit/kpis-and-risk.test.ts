import { describe, expect, it } from "vitest";
import { DEFAULT_PROPERTY } from "@/lib/domain/property";
import { calcKpiSummary, calcMonthlyCashflow } from "@/lib/calculations/kpis";
import { calcProjection } from "@/lib/calculations/projection";
import { calcBreakevenInterestRate } from "@/lib/calculations/risk";

describe("kpis, projection and risk", () => {
  it("calculates monthly cashflow", () => {
    const result = calcMonthlyCashflow(DEFAULT_PROPERTY);
    expect(result.warmRent).toBeGreaterThan(0);
    expect(Number.isFinite(result.afterTaxCashflow)).toBe(true);
  });

  it("calculates KPI summary", () => {
    const summary = calcKpiSummary(DEFAULT_PROPERTY);
    expect(summary.grossYield).toBeGreaterThan(0);
    expect(summary.netYield).toBeLessThan(summary.grossYield);
  });

  it("builds projection over 50 years", () => {
    const projection = calcProjection(DEFAULT_PROPERTY);
    expect(projection).toHaveLength(50);
    expect(projection[0].year).toBe(new Date(DEFAULT_PROPERTY.purchaseDate).getFullYear());
  });

  it("calculates breakeven interest rate", () => {
    const cashflow = calcMonthlyCashflow(DEFAULT_PROPERTY);
    const rate = calcBreakevenInterestRate({
      warmRent: cashflow.warmRent,
      operatingCosts: cashflow.operatingCosts,
      repayment: cashflow.repayment,
      depreciation: 250,
      taxRate: DEFAULT_PROPERTY.personalTaxRate,
      totalDebt: DEFAULT_PROPERTY.loan1Amount + DEFAULT_PROPERTY.loan2Amount,
    });
    expect(Number.isFinite(rate)).toBe(true);
  });
});
