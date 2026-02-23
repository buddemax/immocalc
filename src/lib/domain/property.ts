export interface InitialInvestment {
  name: string;
  cost: number;
  taxTreatment: "activate" | "deduct" | "none";
  valueIncrease: number;
}

export interface LoanChange {
  year: number;
  newRate: number;
}

export interface RepaymentChange {
  year: number;
  newRepayment: number;
}

export interface SpecialRepayment {
  year: number;
  amount: number;
}

export interface MicroLocationBreakdown {
  scoreOepnv: number;
  scoreEinkauf: number;
  scoreBildung: number;
  scoreFreizeit: number;
  gesamtScore: number;
  kurzbegruendung: string;
}

export interface PropertyInput {
  userId?: string;
  address: string;
  purchaseDate: string;
  valuationDate: string;
  propertyType: "apartment" | "multi_family" | "single_family";
  regionKey: string;
  microLocationScore: number;
  microLocationSource: "default" | "manual" | "auto";
  microLocationUpdatedAt: string;
  microLocationConfidence: number;
  microLocationBreakdown?: MicroLocationBreakdown;
  microLocationLastRunId?: string;
  livingArea: number;
  landArea: number;
  parkingSpaces: number;
  yearBuilt: number;
  modernizationYear?: number;
  remainingUsefulLife: number;
  energyClass: "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  heatingType: "district" | "gas" | "oil" | "heatpump" | "other";
  co2CostSplitLandlord: number;
  rentLevelClass: "einfach" | "mittel" | "gut" | "sehr_gut";
  vacancyMicroRisk: number;
  latitude: number;
  longitude: number;
  geoConfidence: number;
  geoResolvedAt: string;
  adminCountryCode: string;
  adminState: string;
  adminCounty: string;
  adminCity: string;
  osmPlaceId: string;
  displayName: string;
  boundaryGeoJson: string;
  shortCode?: string;
  purchasePrice: number;
  brokerFeePercent: number;
  notaryFeePercent: number;
  landRegistryPercent: number;
  transferTaxPercent: number;
  otherCostsPercent: number;
  initialInvestments: InitialInvestment[];
  coldRentPerSqm: number;
  parkingRent: number;
  otherRent: number;
  transferableCosts: number;
  hausgeldTotal: number;
  hausgeldTransferable: number;
  wegReserve: number;
  propertyTax: number;
  otherOperatingCosts: number;
  vacancyReservePercent: number;
  maintenanceReservePerSqm: number;
  depreciationRate: number;
  buildingSharePercent: number;
  personalTaxRate: number;
  loan1Amount: number;
  loan1InterestRate: number;
  loan1InitialRepayment: number;
  loan1InterestChanges?: LoanChange[];
  loan1RepaymentChanges?: RepaymentChange[];
  loan1SpecialRepayments?: SpecialRepayment[];
  loan2Amount: number;
  loan2InterestRate: number;
  loan2InitialRepayment: number;
  loan2InterestChanges?: LoanChange[];
  loan2RepaymentChanges?: RepaymentChange[];
  loan2SpecialRepayments?: SpecialRepayment[];
  costIncreasePercent: number;
  rentIncreasePercent: number;
  valueIncreasePercent: number;
  projectionYear?: number;
}

export interface KpiThresholds {
  grossYieldGreen: number;
  grossYieldYellow: number;
  grossYieldRed: number;
  netYieldGreen: number;
  netYieldYellow: number;
  netYieldRed: number;
  equityReturnGreen: number;
  equityReturnYellow: number;
  equityReturnRed: number;
  operativeCfGreen: number;
  operativeCfYellow: number;
  operativeCfRed: number;
  afterTaxCfGreen: number;
  afterTaxCfYellow: number;
  afterTaxCfRed: number;
}

export const DEFAULT_PROPERTY: PropertyInput = {
  address: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  valuationDate: new Date().toISOString().slice(0, 10),
  propertyType: "apartment",
  regionKey: "DE-BE",
  microLocationScore: 0.65,
  microLocationSource: "default",
  microLocationUpdatedAt: "",
  microLocationConfidence: 0,
  microLocationBreakdown: undefined,
  microLocationLastRunId: undefined,
  livingArea: 60,
  landArea: 0,
  parkingSpaces: 0,
  yearBuilt: 1995,
  modernizationYear: undefined,
  remainingUsefulLife: 50,
  energyClass: "D",
  heatingType: "gas",
  co2CostSplitLandlord: 0.5,
  rentLevelClass: "mittel",
  vacancyMicroRisk: 0.03,
  latitude: 0,
  longitude: 0,
  geoConfidence: 0,
  geoResolvedAt: "",
  adminCountryCode: "DE",
  adminState: "",
  adminCounty: "",
  adminCity: "",
  osmPlaceId: "",
  displayName: "",
  boundaryGeoJson: "",
  shortCode: "",
  purchasePrice: 250000,
  brokerFeePercent: 0.0357,
  notaryFeePercent: 0.015,
  landRegistryPercent: 0.005,
  transferTaxPercent: 0.065,
  otherCostsPercent: 0,
  initialInvestments: [],
  coldRentPerSqm: 11,
  parkingRent: 0,
  otherRent: 0,
  transferableCosts: 150,
  hausgeldTotal: 300,
  hausgeldTransferable: 170,
  wegReserve: 40,
  propertyTax: 25,
  otherOperatingCosts: 30,
  vacancyReservePercent: 0.03,
  maintenanceReservePerSqm: 12,
  depreciationRate: 0.02,
  buildingSharePercent: 0.75,
  personalTaxRate: 0.42,
  loan1Amount: 200000,
  loan1InterestRate: 0.037,
  loan1InitialRepayment: 0.02,
  loan1InterestChanges: [],
  loan1RepaymentChanges: [],
  loan1SpecialRepayments: [],
  loan2Amount: 0,
  loan2InterestRate: 0,
  loan2InitialRepayment: 0,
  loan2InterestChanges: [],
  loan2RepaymentChanges: [],
  loan2SpecialRepayments: [],
  costIncreasePercent: 0.03,
  rentIncreasePercent: 0.02,
  valueIncreasePercent: 0.02,
  projectionYear: new Date().getFullYear(),
};

export const DEFAULT_KPI_THRESHOLDS: KpiThresholds = {
  grossYieldGreen: 0.05,
  grossYieldYellow: 0.04,
  grossYieldRed: 0.03,
  netYieldGreen: 0.04,
  netYieldYellow: 0.03,
  netYieldRed: 0.02,
  equityReturnGreen: 0.08,
  equityReturnYellow: 0.05,
  equityReturnRed: 0.02,
  operativeCfGreen: 150,
  operativeCfYellow: 0,
  operativeCfRed: -150,
  afterTaxCfGreen: 100,
  afterTaxCfYellow: 0,
  afterTaxCfRed: -150,
};

export const PROPERTY_FIELD_KEYS = [
  "address",
  "purchaseDate",
  "valuationDate",
  "propertyType",
  "regionKey",
  "microLocationScore",
  "microLocationSource",
  "microLocationUpdatedAt",
  "microLocationConfidence",
  "microLocationBreakdown",
  "microLocationLastRunId",
  "livingArea",
  "landArea",
  "parkingSpaces",
  "yearBuilt",
  "modernizationYear",
  "remainingUsefulLife",
  "energyClass",
  "heatingType",
  "co2CostSplitLandlord",
  "rentLevelClass",
  "vacancyMicroRisk",
  "latitude",
  "longitude",
  "geoConfidence",
  "geoResolvedAt",
  "adminCountryCode",
  "adminState",
  "adminCounty",
  "adminCity",
  "osmPlaceId",
  "displayName",
  "boundaryGeoJson",
  "shortCode",
  "purchasePrice",
  "brokerFeePercent",
  "notaryFeePercent",
  "landRegistryPercent",
  "transferTaxPercent",
  "otherCostsPercent",
  "initialInvestments",
  "coldRentPerSqm",
  "parkingRent",
  "otherRent",
  "transferableCosts",
  "hausgeldTotal",
  "hausgeldTransferable",
  "wegReserve",
  "propertyTax",
  "otherOperatingCosts",
  "vacancyReservePercent",
  "maintenanceReservePerSqm",
  "depreciationRate",
  "buildingSharePercent",
  "personalTaxRate",
  "loan1Amount",
  "loan1InterestRate",
  "loan1InitialRepayment",
  "loan1InterestChanges",
  "loan1RepaymentChanges",
  "loan1SpecialRepayments",
  "loan2Amount",
  "loan2InterestRate",
  "loan2InitialRepayment",
  "loan2InterestChanges",
  "loan2RepaymentChanges",
  "loan2SpecialRepayments",
  "costIncreasePercent",
  "rentIncreasePercent",
  "valueIncreasePercent",
  "projectionYear",
] as const;

export function pickPropertyInput(source: Record<string, unknown> | null | undefined): PropertyInput {
  if (!source) {
    return DEFAULT_PROPERTY;
  }

  const result: Record<string, unknown> = {};
  for (const key of PROPERTY_FIELD_KEYS) {
    if (key in source) {
      result[key] = source[key];
    }
  }

  return {
    ...DEFAULT_PROPERTY,
    ...result,
    initialInvestments: (result.initialInvestments as InitialInvestment[] | undefined) ?? [],
    loan1InterestChanges: (result.loan1InterestChanges as LoanChange[] | undefined) ?? [],
    loan1RepaymentChanges: (result.loan1RepaymentChanges as RepaymentChange[] | undefined) ?? [],
    loan1SpecialRepayments: (result.loan1SpecialRepayments as SpecialRepayment[] | undefined) ?? [],
    loan2InterestChanges: (result.loan2InterestChanges as LoanChange[] | undefined) ?? [],
    loan2RepaymentChanges: (result.loan2RepaymentChanges as RepaymentChange[] | undefined) ?? [],
    loan2SpecialRepayments: (result.loan2SpecialRepayments as SpecialRepayment[] | undefined) ?? [],
  };
}
