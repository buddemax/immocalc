import { RegulatoryParameterSet } from "@/lib/domain/valuation";

export const DEFAULT_REGULATORY_PARAMETERS: RegulatoryParameterSet[] = [
  {
    country: "DE",
    regionKey: "DE",
    validFrom: "2025-01-01",
    version: "de-2025-v1",
    transferTax: 0.05,
    afaRules: {
      defaultRate: 0.02,
      post1925Rate: 0.02,
      pre1925Rate: 0.025,
    },
    opCostDefaults: {
      vacancyRate: 0.03,
      adminRate: 0.02,
      maintenancePerSqmAnnual: 12,
    },
    valuationDefaults: {
      capRateFloor: 0.02,
      capRateCeil: 0.09,
      marketAdjustmentFloor: 0.8,
      marketAdjustmentCeil: 1.2,
    },
  },
];
