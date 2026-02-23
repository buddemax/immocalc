export type ValuationMethod = "ertragswert" | "vergleichswert" | "sachwert";

export interface MarketDataSnapshot {
  metric:
    | "land_value_per_sqm"
    | "cap_rate"
    | "market_rent_per_sqm"
    | "property_price_per_sqm"
    | "material_factor"
    | "regional_vacancy_rate"
    | "poi_supermarket_1km"
    | "poi_school_1km"
    | "poi_transit_1km"
    | "distance_transit_m"
    | "distance_center_m";
  value: number;
  unit: "eur_per_sqm" | "percent" | "factor" | "meters";
  sourceType: "manual" | "csv_import" | "internal_default" | "api_geo" | "api_boris";
  sourceLabel: string;
  sourceUrl?: string;
  effectiveDate: string;
  confidence: number;
  regionKey: string;
}

export interface ComparableSaleInput {
  pricePerSqm: number;
  livingArea: number;
  distanceKm: number;
  conditionScore: number;
  yearBuilt: number;
}

export interface ValuationInput {
  valuationDate: string;
  regionKey: string;
  livingArea: number;
  landArea: number;
  yearBuilt: number;
  remainingUsefulLife: number;
  microLocationScore: number;
  netOperatingIncomeAnnual: number;
  maintenanceAnnual: number;
  marketRentPerSqm: number;
  capRate: number;
  landValuePerSqm: number;
  replacementCostPerSqm: number;
  materialFactor: number;
  comparableSales: ComparableSaleInput[];
}

export interface RegulatoryParameterSet {
  country: string;
  regionKey: string;
  validFrom: string;
  validTo?: string;
  version: string;
  transferTax: number;
  afaRules: {
    defaultRate: number;
    post1925Rate: number;
    pre1925Rate: number;
  };
  opCostDefaults: {
    vacancyRate: number;
    adminRate: number;
    maintenancePerSqmAnnual: number;
  };
  valuationDefaults: {
    capRateFloor: number;
    capRateCeil: number;
    marketAdjustmentFloor: number;
    marketAdjustmentCeil: number;
  };
}

export interface MethodResult {
  method: ValuationMethod;
  value: number;
  bandLow: number;
  bandHigh: number;
  qualityScore: number;
  warnings: string[];
}

export interface ErtragswertResult extends MethodResult {
  method: "ertragswert";
  annualReinertrag: number;
  landValue: number;
  buildingValue: number;
  capitalizer: number;
}

export interface VergleichswertResult extends MethodResult {
  method: "vergleichswert";
  comparableCount: number;
  weightedMedianPricePerSqm: number;
}

export interface SachwertResult extends MethodResult {
  method: "sachwert";
  replacementCost: number;
  depreciationFactor: number;
  adjustedMaterialFactor: number;
}

export interface ScenarioInput {
  id: "base" | "optimistic" | "conservative";
  label: string;
  rentDelta: number;
  costDelta: number;
  valueDelta: number;
  capRateDelta: number;
}

export interface ValuationSuiteResult {
  ertragswert: ErtragswertResult;
  vergleichswert: VergleichswertResult;
  sachwert: SachwertResult;
  assumptions: Record<string, number | string>;
  warnings: string[];
}

export const DEFAULT_SCENARIOS: ScenarioInput[] = [
  {
    id: "base",
    label: "Basis",
    rentDelta: 0,
    costDelta: 0,
    valueDelta: 0,
    capRateDelta: 0,
  },
  {
    id: "optimistic",
    label: "Optimistisch",
    rentDelta: 0.01,
    costDelta: -0.005,
    valueDelta: 0.01,
    capRateDelta: -0.002,
  },
  {
    id: "conservative",
    label: "Konservativ",
    rentDelta: -0.01,
    costDelta: 0.01,
    valueDelta: -0.01,
    capRateDelta: 0.002,
  },
];
