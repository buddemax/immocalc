import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const initialInvestment = v.object({
  name: v.string(),
  cost: v.float64(),
  taxTreatment: v.union(v.literal("activate"), v.literal("deduct"), v.literal("none")),
  valueIncrease: v.float64(),
});

const loanInterestChange = v.object({
  year: v.number(),
  newRate: v.float64(),
});

const loanRepaymentChange = v.object({
  year: v.number(),
  newRepayment: v.float64(),
});

const specialRepayment = v.object({
  year: v.number(),
  amount: v.float64(),
});

const propertyType = v.union(v.literal("apartment"), v.literal("multi_family"), v.literal("single_family"));
const energyClass = v.union(
  v.literal("A+"),
  v.literal("A"),
  v.literal("B"),
  v.literal("C"),
  v.literal("D"),
  v.literal("E"),
  v.literal("F"),
  v.literal("G"),
  v.literal("H"),
);
const heatingType = v.union(v.literal("district"), v.literal("gas"), v.literal("oil"), v.literal("heatpump"), v.literal("other"));
const rentLevelClass = v.union(v.literal("einfach"), v.literal("mittel"), v.literal("gut"), v.literal("sehr_gut"));
const microLocationSource = v.union(v.literal("default"), v.literal("manual"), v.literal("auto"));
const populationClass = v.union(
  v.literal("metropole"),
  v.literal("grossstadt"),
  v.literal("mittelstadt"),
  v.literal("kleinstadt"),
  v.literal("dorf"),
  v.literal("unknown"),
);
const microLocationBreakdown = v.object({
  scoreOepnv: v.float64(),
  scoreEinkauf: v.float64(),
  scoreBildung: v.float64(),
  scoreFreizeit: v.float64(),
  gesamtScore: v.float64(),
  kurzbegruendung: v.string(),
});

export const propertyFields = {
  userId: v.string(),
  address: v.string(),
  purchaseDate: v.string(),
  valuationDate: v.optional(v.string()),
  propertyType: v.optional(propertyType),
  regionKey: v.optional(v.string()),
  microLocationScore: v.optional(v.float64()),
  microLocationSource: v.optional(microLocationSource),
  microLocationUpdatedAt: v.optional(v.string()),
  microLocationConfidence: v.optional(v.float64()),
  microLocationBreakdown: v.optional(microLocationBreakdown),
  microLocationLastRunId: v.optional(v.id("microLocationRuns")),
  livingArea: v.float64(),
  landArea: v.optional(v.float64()),
  parkingSpaces: v.number(),
  yearBuilt: v.optional(v.number()),
  modernizationYear: v.optional(v.number()),
  remainingUsefulLife: v.optional(v.number()),
  energyClass: v.optional(energyClass),
  heatingType: v.optional(heatingType),
  co2CostSplitLandlord: v.optional(v.float64()),
  rentLevelClass: v.optional(rentLevelClass),
  vacancyMicroRisk: v.optional(v.float64()),
  latitude: v.optional(v.float64()),
  longitude: v.optional(v.float64()),
  geoConfidence: v.optional(v.float64()),
  geoResolvedAt: v.optional(v.string()),
  adminCountryCode: v.optional(v.string()),
  adminState: v.optional(v.string()),
  adminCounty: v.optional(v.string()),
  adminCity: v.optional(v.string()),
  osmPlaceId: v.optional(v.string()),
  displayName: v.optional(v.string()),
  boundaryGeoJson: v.optional(v.string()),
  shortCode: v.optional(v.string()),
  purchasePrice: v.float64(),
  brokerFeePercent: v.float64(),
  notaryFeePercent: v.float64(),
  landRegistryPercent: v.float64(),
  transferTaxPercent: v.float64(),
  otherCostsPercent: v.float64(),
  initialInvestments: v.array(initialInvestment),
  coldRentPerSqm: v.float64(),
  parkingRent: v.float64(),
  otherRent: v.float64(),
  transferableCosts: v.float64(),
  hausgeldTotal: v.float64(),
  hausgeldTransferable: v.float64(),
  wegReserve: v.float64(),
  propertyTax: v.float64(),
  otherOperatingCosts: v.float64(),
  vacancyReservePercent: v.float64(),
  maintenanceReservePerSqm: v.float64(),
  depreciationRate: v.float64(),
  buildingSharePercent: v.float64(),
  personalTaxRate: v.float64(),
  loan1Amount: v.float64(),
  loan1InterestRate: v.float64(),
  loan1InitialRepayment: v.float64(),
  loan1InterestChanges: v.optional(v.array(loanInterestChange)),
  loan1RepaymentChanges: v.optional(v.array(loanRepaymentChange)),
  loan1SpecialRepayments: v.optional(v.array(specialRepayment)),
  loan2Amount: v.float64(),
  loan2InterestRate: v.float64(),
  loan2InitialRepayment: v.float64(),
  loan2InterestChanges: v.optional(v.array(loanInterestChange)),
  loan2RepaymentChanges: v.optional(v.array(loanRepaymentChange)),
  loan2SpecialRepayments: v.optional(v.array(specialRepayment)),
  costIncreasePercent: v.float64(),
  rentIncreasePercent: v.float64(),
  valueIncreasePercent: v.float64(),
  projectionYear: v.optional(v.number()),
};

const personalInfo = {
  name: v.string(),
  address: v.string(),
  city: v.string(),
  maritalStatus: v.string(),
  propertyRegime: v.string(),
  children: v.string(),
  referenceDate: v.string(),
};

const marketDataMetric = v.union(
  v.literal("land_value_per_sqm"),
  v.literal("cap_rate"),
  v.literal("market_rent_per_sqm"),
  v.literal("property_price_per_sqm"),
  v.literal("material_factor"),
  v.literal("regional_vacancy_rate"),
  v.literal("poi_supermarket_1km"),
  v.literal("poi_school_1km"),
  v.literal("poi_transit_1km"),
  v.literal("distance_transit_m"),
  v.literal("distance_center_m"),
);

const marketDataUnit = v.union(v.literal("eur_per_sqm"), v.literal("percent"), v.literal("factor"), v.literal("meters"));
const marketDataSourceType = v.union(
  v.literal("manual"),
  v.literal("csv_import"),
  v.literal("internal_default"),
  v.literal("api_geo"),
  v.literal("api_boris"),
);

export default defineSchema({
  properties: defineTable(propertyFields).index("by_user", ["userId"]),
  kpiThresholds: defineTable({
    userId: v.string(),
    grossYieldGreen: v.float64(),
    grossYieldYellow: v.float64(),
    grossYieldRed: v.float64(),
    netYieldGreen: v.float64(),
    netYieldYellow: v.float64(),
    netYieldRed: v.float64(),
    equityReturnGreen: v.float64(),
    equityReturnYellow: v.float64(),
    equityReturnRed: v.float64(),
    operativeCfGreen: v.float64(),
    operativeCfYellow: v.float64(),
    operativeCfRed: v.float64(),
    afterTaxCfGreen: v.float64(),
    afterTaxCfYellow: v.float64(),
    afterTaxCfRed: v.float64(),
  }).index("by_user", ["userId"]),
  householdBudgets: defineTable({
    userId: v.string(),
    personalInfo: v.object(personalInfo),
    income: v.array(
      v.object({
        category: v.string(),
        annualAmount: v.float64(),
        comment: v.optional(v.string()),
      }),
    ),
    expenses: v.array(
      v.object({
        category: v.string(),
        annualAmount: v.float64(),
        comment: v.optional(v.string()),
      }),
    ),
  }).index("by_user", ["userId"]),
  assetStatements: defineTable({
    userId: v.string(),
    personalInfo: v.object(personalInfo),
    assets: v.array(
      v.object({
        description: v.string(),
        amount: v.float64(),
        pledged: v.boolean(),
        comment: v.optional(v.string()),
      }),
    ),
    liabilities: v.array(
      v.object({
        description: v.string(),
        amount: v.float64(),
        comment: v.optional(v.string()),
      }),
    ),
  }).index("by_user", ["userId"]),
  marketDataSnapshots: defineTable({
    userId: v.string(),
    propertyId: v.id("properties"),
    metric: marketDataMetric,
    value: v.float64(),
    unit: marketDataUnit,
    sourceType: marketDataSourceType,
    sourceLabel: v.string(),
    sourceUrl: v.optional(v.string()),
    effectiveDate: v.string(),
    confidence: v.float64(),
    regionKey: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_property", ["propertyId"])
    .index("by_property_metric", ["propertyId", "metric"]),
  geoCache: defineTable({
    userId: v.string(),
    cacheKey: v.string(),
    provider: v.string(),
    requestType: v.string(),
    payload: v.string(),
    status: v.union(v.literal("ok"), v.literal("error")),
    fetchedAt: v.string(),
    expiresAt: v.string(),
    error: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_key", ["userId", "cacheKey"]),
  borisProviderConfigs: defineTable({
    stateCode: v.string(),
    providerType: v.string(),
    baseUrl: v.string(),
    collectionId: v.string(),
    enabled: v.boolean(),
    priority: v.number(),
    mappingVersion: v.string(),
  })
    .index("by_state", ["stateCode"])
    .index("by_enabled_priority", ["enabled", "priority"]),
  valuationRuns: defineTable({
    userId: v.string(),
    propertyId: v.id("properties"),
    runAt: v.string(),
    inputHash: v.string(),
    parameterSetVersion: v.string(),
    methods: v.array(v.string()),
    results: v.object({
      primaryValue: v.float64(),
      ertragswert: v.float64(),
      vergleichswert: v.float64(),
      sachwert: v.float64(),
      bandLow: v.float64(),
      bandHigh: v.float64(),
    }),
    warnings: v.array(v.string()),
    scenarioId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_property", ["propertyId"]),
  microLocationRuns: defineTable({
    userId: v.string(),
    propertyId: v.id("properties"),
    runAt: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    inputSnapshot: v.object({
      address: v.string(),
      lat: v.optional(v.float64()),
      lon: v.optional(v.float64()),
      radiusPrimary: v.float64(),
      radiusSecondary: v.float64(),
      countryCode: v.string(),
    }),
    dataSnapshot: v.optional(
      v.object({
        populationValue: v.optional(v.float64()),
        populationClass,
        poiSummary: v.object({
          supermarketsCount: v.float64(),
          nearestSupermarketMeters: v.optional(v.float64()),
          transitCount: v.float64(),
          nearestTransitMeters: v.optional(v.float64()),
          schoolsCount: v.float64(),
          nearestSchoolMeters: v.optional(v.float64()),
          parksCount: v.float64(),
          nearestParkMeters: v.optional(v.float64()),
        }),
        sourceMeta: v.object({
          geocodeProvider: v.string(),
          poiProvider: v.string(),
          populationSource: v.string(),
        }),
      }),
    ),
    llmOutput: v.optional(v.string()),
    result: v.optional(
      v.object({
        scoreOepnv: v.float64(),
        scoreEinkauf: v.float64(),
        scoreBildung: v.float64(),
        scoreFreizeit: v.float64(),
        gesamtScore: v.float64(),
        kurzbegruendung: v.string(),
        confidence: v.float64(),
      }),
    ),
    errorMessage: v.optional(v.string()),
    providerMeta: v.optional(
      v.object({
        fastApiUrl: v.string(),
        model: v.optional(v.string()),
      }),
    ),
    durationMs: v.optional(v.float64()),
  })
    .index("by_user", ["userId"])
    .index("by_property", ["propertyId"])
    .index("by_property_run_at", ["propertyId", "runAt"]),
  regulatoryParameterSets: defineTable({
    country: v.string(),
    regionKey: v.string(),
    validFrom: v.string(),
    validTo: v.optional(v.string()),
    version: v.string(),
    transferTax: v.float64(),
    afaRules: v.object({
      defaultRate: v.float64(),
      post1925Rate: v.float64(),
      pre1925Rate: v.float64(),
    }),
    opCostDefaults: v.object({
      vacancyRate: v.float64(),
      adminRate: v.float64(),
      maintenancePerSqmAnnual: v.float64(),
    }),
    valuationDefaults: v.object({
      capRateFloor: v.float64(),
      capRateCeil: v.float64(),
      marketAdjustmentFloor: v.float64(),
      marketAdjustmentCeil: v.float64(),
    }),
  })
    .index("by_region", ["regionKey"])
    .index("by_country", ["country"]),
});
