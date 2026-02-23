import { describe, expect, it } from "vitest";
import {
  calcFullRepaymentYear,
  calcLoanSchedule,
  calcWeightedInterestRate,
} from "@/lib/calculations/financing";

describe("financing calculations", () => {
  it("builds a 50-year schedule", () => {
    const schedule = calcLoanSchedule(
      {
        amount: 100000,
        interestRate: 0.03,
        initialRepayment: 0.02,
      },
      2026,
    );

    expect(schedule).toHaveLength(50);
    expect(schedule[0].openingBalance).toBe(100000);
    expect(schedule[0].closingBalance).toBeLessThan(100000);
  });

  it("applies rate and repayment changes", () => {
    const schedule = calcLoanSchedule(
      {
        amount: 150000,
        interestRate: 0.03,
        initialRepayment: 0.02,
        interestChanges: [{ year: 2028, newRate: 0.04 }],
        repaymentChanges: [{ year: 2028, newRepayment: 0.03 }],
      },
      2026,
    );

    const changedYear = schedule.find((entry) => entry.year === 2028);
    expect(changedYear?.interestRate).toBeCloseTo(0.04, 6);
  });

  it("returns weighted rate and detects full repayment when a terminal special repayment exists", () => {
    const weighted = calcWeightedInterestRate(100000, 0.03, 50000, 0.05);
    expect(weighted).toBeCloseTo(0.036666, 4);

    const schedule = calcLoanSchedule(
      {
        amount: 10000,
        interestRate: 0.01,
        initialRepayment: 0.1,
        specialRepayments: [{ year: 2027, amount: 9000 }],
      },
      2026,
    );
    expect(calcFullRepaymentYear(schedule)).toBe(2027);
  });
});
