export type PlanTier = "free" | "pro";

export type Feature =
  | "second_loan"
  | "projection_50y"
  | "loan_changes"
  | "special_repayments"
  | "bank_report"
  | "charts"
  | "household_budget"
  | "asset_statement"
  | "valuation_v2"
  | "market_data_import"
  | "scenario_analysis"
  | "valuation_report"
  | "geo_boris_v1"
  | "micro_location_auto_v1";

const PRO_ONLY: Feature[] = [
  "second_loan",
  "projection_50y",
  "loan_changes",
  "special_repayments",
  "bank_report",
  "charts",
  "household_budget",
  "asset_statement",
  "valuation_v2",
  "market_data_import",
  "scenario_analysis",
  "valuation_report",
  "geo_boris_v1",
  "micro_location_auto_v1",
];

export function getPlanTier(identity: Record<string, unknown>): PlanTier {
  const direct = identity.planTier;
  const claims = identity.claims as Record<string, unknown> | undefined;
  const publicMetadata = claims?.public_metadata as Record<string, unknown> | undefined;

  const value = direct ?? claims?.planTier ?? publicMetadata?.planTier;
  return value === "free" ? "free" : "pro";
}

export function isFeatureAllowed(planTier: PlanTier, feature: Feature) {
  if (planTier === "pro") {
    return true;
  }
  return !PRO_ONLY.includes(feature);
}

export function assertFeature(planTier: PlanTier, feature: Feature) {
  if (!isFeatureAllowed(planTier, feature)) {
    throw new Error("Feature requires pro plan");
  }
}
