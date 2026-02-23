export function calcBreakevenInterestRate(p: {
  warmRent: number;
  operatingCosts: number;
  repayment: number;
  depreciation: number;
  taxRate: number;
  totalDebt: number;
}) {
  if (p.totalDebt <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  const numerator =
    p.warmRent - p.operatingCosts - p.repayment - (p.warmRent - p.operatingCosts - p.depreciation) * p.taxRate;
  const denominator = 1 - p.taxRate;
  const monthlyInterestBreakeven = numerator / denominator;

  return (monthlyInterestBreakeven * 12) / p.totalDebt;
}
