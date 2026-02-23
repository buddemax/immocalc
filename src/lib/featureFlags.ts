export type PlanTier = "free" | "pro";

export type FeatureKey =
  | "second_loan"
  | "loan_changes"
  | "special_repayments"
  | "projection_50y"
  | "equity_return"
  | "interest_risk"
  | "bank_report"
  | "household_budget"
  | "asset_statement"
  | "charts"
  | "valuation_v2"
  | "market_data_import"
  | "scenario_analysis"
  | "valuation_report"
  | "geo_boris_v1"
  | "micro_location_auto_v1";

const FREE_FEATURES: FeatureKey[] = [];
const PRO_FEATURES: FeatureKey[] = [
  "second_loan",
  "loan_changes",
  "special_repayments",
  "projection_50y",
  "equity_return",
  "interest_risk",
  "bank_report",
  "household_budget",
  "asset_statement",
  "charts",
  "valuation_v2",
  "market_data_import",
  "scenario_analysis",
  "valuation_report",
  "geo_boris_v1",
  "micro_location_auto_v1",
];

export function isFeatureEnabled(planTier: PlanTier, feature: FeatureKey): boolean {
  if (planTier === "pro") {
    return PRO_FEATURES.includes(feature) || FREE_FEATURES.includes(feature);
  }
  return FREE_FEATURES.includes(feature);
}
