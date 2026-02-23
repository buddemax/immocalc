import { PropertyInput } from "@/lib/domain/property";
import { calcDepreciation } from "@/lib/calculations/depreciation";
import { calcLoanSchedule } from "@/lib/calculations/financing";
import { calcOperatingCosts, calcRent, calcTotalInvestment } from "@/lib/calculations/core";
import { calcMonthlyTax } from "@/lib/calculations/tax";

export interface CashflowResult {
  warmRent: number;
  operatingCosts: number;
  interest: number;
  repayment: number;
  operativeCashflow: number;
  tax: number;
  afterTaxCashflow: number;
}

export function calcMonthlyCashflow(p: PropertyInput): CashflowResult {
  const rent = calcRent(p);
  const opCosts = calcOperatingCosts(p);
  const depr = calcDepreciation(p);
  const startYear = new Date(p.purchaseDate).getFullYear();

  const loan1Schedule = calcLoanSchedule(
    {
      amount: p.loan1Amount,
      interestRate: p.loan1InterestRate,
      initialRepayment: p.loan1InitialRepayment,
      interestChanges: p.loan1InterestChanges,
      repaymentChanges: p.loan1RepaymentChanges,
      specialRepayments: p.loan1SpecialRepayments,
    },
    startYear,
  );

  const loan2Schedule = calcLoanSchedule(
    {
      amount: p.loan2Amount,
      interestRate: p.loan2InterestRate,
      initialRepayment: p.loan2InitialRepayment,
      interestChanges: p.loan2InterestChanges,
      repaymentChanges: p.loan2RepaymentChanges,
      specialRepayments: p.loan2SpecialRepayments,
    },
    startYear,
  );

  const monthlyInterest = (loan1Schedule[0].interest + loan2Schedule[0].interest) / 12;
  const monthlyRepayment = (loan1Schedule[0].repayment + loan2Schedule[0].repayment) / 12;

  const operativeCF = rent.warmRent - opCosts.total - monthlyInterest - monthlyRepayment;
  const opCostsWithoutOwnReserve = opCosts.total - opCosts.ownMaintenanceReserve;

  const { monthlyTax } = calcMonthlyTax({
    warmRent: rent.warmRent,
    operatingCostsWithoutOwnReserve: opCostsWithoutOwnReserve,
    monthlyInterest,
    monthlyDepreciation: depr.monthlyDepreciation,
    marginalTaxRate: p.personalTaxRate,
    churchTaxRate: 0,
  });

  return {
    warmRent: rent.warmRent,
    operatingCosts: opCosts.total,
    interest: monthlyInterest,
    repayment: monthlyRepayment,
    operativeCashflow: operativeCF,
    tax: monthlyTax,
    afterTaxCashflow: operativeCF - monthlyTax,
  };
}

export function calcGrossYield(annualColdRent: number, purchasePrice: number) {
  return purchasePrice > 0 ? annualColdRent / purchasePrice : 0;
}

export function calcNetYield(annualColdRent: number, annualNonTransferableCosts: number, totalInvestment: number) {
  return totalInvestment > 0 ? (annualColdRent - annualNonTransferableCosts) / totalInvestment : 0;
}

export function calcPurchaseMultiplier(purchasePrice: number, annualColdRent: number) {
  return annualColdRent > 0 ? purchasePrice / annualColdRent : 0;
}

export function calcEquityReturn(p: {
  monthlyCFAfterTax: number;
  annualValueIncrease: number;
  annualRepayment: number;
  equity: number;
  includeValueIncrease?: boolean;
}) {
  if (p.equity <= 0) {
    return 0;
  }
  const numerator =
    p.monthlyCFAfterTax * 12 +
    (p.includeValueIncrease !== false ? p.annualValueIncrease : 0) +
    p.annualRepayment;
  return numerator / p.equity;
}

export function calcWealthGrowth(p: {
  monthlyCFAfterTax: number;
  annualRepayment: number;
  annualValueIncrease: number;
  includeValueIncrease?: boolean;
}) {
  return (
    p.monthlyCFAfterTax * 12 +
    p.annualRepayment +
    (p.includeValueIncrease !== false ? p.annualValueIncrease : 0)
  );
}

export function calcKpiSummary(p: PropertyInput) {
  const rent = calcRent(p);
  const costs = calcOperatingCosts(p);
  const cashflow = calcMonthlyCashflow(p);
  const totalInvestment = calcTotalInvestment(p);

  const annualColdRent = rent.netColdRent * 12;
  const annualNonTransferableCosts = costs.nonTransferable * 12;
  const equity = Math.max(1, totalInvestment - p.loan1Amount - p.loan2Amount);
  const annualValueIncrease = p.purchasePrice * p.valueIncreasePercent;
  const annualRepayment = cashflow.repayment * 12;

  return {
    grossYield: calcGrossYield(annualColdRent, p.purchasePrice),
    netYield: calcNetYield(annualColdRent, annualNonTransferableCosts, totalInvestment),
    purchaseMultiplier: calcPurchaseMultiplier(p.purchasePrice, annualColdRent),
    equityReturn: calcEquityReturn({
      monthlyCFAfterTax: cashflow.afterTaxCashflow,
      annualValueIncrease,
      annualRepayment,
      equity,
    }),
    wealthGrowth: calcWealthGrowth({
      monthlyCFAfterTax: cashflow.afterTaxCashflow,
      annualRepayment,
      annualValueIncrease,
    }),
    totalInvestment,
  };
}
