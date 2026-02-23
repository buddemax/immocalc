import { PropertyInput } from "@/lib/domain/property";
import { ScenarioInput } from "@/lib/domain/valuation";
import { calcDepreciation } from "@/lib/calculations/depreciation";
import { calcLoanSchedule, calcWeightedInterestRate } from "@/lib/calculations/financing";
import { calcOperatingCosts, calcPurchaseCosts, calcRent } from "@/lib/calculations/core";

export interface YearProjection {
  scenarioId: string;
  year: number;
  netColdRent: number;
  transferableCosts: number;
  warmRent: number;
  propertyValueStart: number;
  propertyValueEnd: number;
  valueIncrease: number;
  depreciationBase: number;
  annualDepreciation: number;
  cumulativeDepreciation: number;
  totalDebtStart: number;
  totalDebtEnd: number;
  totalInterest: number;
  totalRepayment: number;
  totalAnnuity: number;
  weightedInterestRate: number;
  netEquity: number;
  operativeCashflow: number;
  tax: number;
  afterTaxCashflow: number;
}

function scenarioAdjustedRates(
  p: PropertyInput,
  scenario: ScenarioInput,
): { rentIncreasePercent: number; costIncreasePercent: number; valueIncreasePercent: number } {
  return {
    rentIncreasePercent: p.rentIncreasePercent + scenario.rentDelta,
    costIncreasePercent: p.costIncreasePercent + scenario.costDelta,
    valueIncreasePercent: p.valueIncreasePercent + scenario.valueDelta,
  };
}

export function calcProjection(p: PropertyInput, scenario?: ScenarioInput): YearProjection[] {
  const activeScenario: ScenarioInput = scenario ?? {
    id: "base",
    label: "Basis",
    rentDelta: 0,
    costDelta: 0,
    valueDelta: 0,
    capRateDelta: 0,
  };
  const rates = scenarioAdjustedRates(p, activeScenario);
  const startYear = new Date(p.purchaseDate).getFullYear();
  const purchaseCosts = calcPurchaseCosts(p);
  const initialPropertyValue =
    p.purchasePrice + purchaseCosts.totalAmount + p.initialInvestments.reduce((sum, item) => sum + item.valueIncrease, 0);

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

  const depr = calcDepreciation(p);
  const baseRent = calcRent(p);
  const baseOpCosts = calcOperatingCosts(p);

  const results: YearProjection[] = [];
  let cumulativeDepr = 0;

  for (let i = 0; i < 50; i += 1) {
    const year = startYear + i;
    const rentFactor = Math.pow(1 + rates.rentIncreasePercent, i);
    const costFactor = Math.pow(1 + rates.costIncreasePercent, i);

    const netColdRent = baseRent.netColdRent * rentFactor;
    const transferableCosts = baseOpCosts.transferable * costFactor;
    const warmRent = netColdRent + transferableCosts;

    const propertyValueStart = initialPropertyValue * Math.pow(1 + rates.valueIncreasePercent, i);
    const propertyValueEnd = initialPropertyValue * Math.pow(1 + rates.valueIncreasePercent, i + 1);
    const valueIncrease = propertyValueEnd - propertyValueStart;

    cumulativeDepr += depr.annualDepreciation;

    const loan1 = loan1Schedule[i];
    const loan2 = loan2Schedule[i];

    const totalDebtStart = loan1.openingBalance + loan2.openingBalance;
    const totalDebtEnd = loan1.closingBalance + loan2.closingBalance;
    const totalInterest = loan1.interest + loan2.interest;
    const totalRepayment = loan1.repayment + loan2.repayment;

    const nonTransferableCosts = baseOpCosts.nonTransferable * costFactor;
    const monthlyInterest = totalInterest / 12;
    const monthlyRepayment = totalRepayment / 12;
    const monthlyWarmRent = warmRent;
    const monthlyOpCosts = transferableCosts + nonTransferableCosts;

    const operativeCashflow = monthlyWarmRent - monthlyOpCosts - monthlyInterest - monthlyRepayment;
    const opCostsWithoutOwnReserve = monthlyOpCosts - baseOpCosts.ownMaintenanceReserve * costFactor;
    const taxableIncome = monthlyWarmRent - opCostsWithoutOwnReserve - monthlyInterest - depr.monthlyDepreciation;
    const tax = taxableIncome * p.personalTaxRate;

    results.push({
      scenarioId: activeScenario.id,
      year,
      netColdRent,
      transferableCosts,
      warmRent,
      propertyValueStart,
      propertyValueEnd,
      valueIncrease,
      depreciationBase: depr.depreciationBase,
      annualDepreciation: depr.annualDepreciation,
      cumulativeDepreciation: cumulativeDepr,
      totalDebtStart,
      totalDebtEnd,
      totalInterest,
      totalRepayment,
      totalAnnuity: loan1.annuity + loan2.annuity,
      weightedInterestRate: calcWeightedInterestRate(
        loan1.openingBalance,
        loan1.interestRate,
        loan2.openingBalance,
        loan2.interestRate,
      ),
      netEquity: propertyValueStart - totalDebtStart,
      operativeCashflow,
      tax,
      afterTaxCashflow: operativeCashflow - tax,
    });
  }

  return results;
}
