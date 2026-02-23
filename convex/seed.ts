import { mutation } from "./_generated/server";
import { requireIdentity } from "./auth";

export const seedDemoProperty = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("properties")
      .withIndex("by_user", (queryBuilder) => queryBuilder.eq("userId", identity.subject))
      .first();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert("properties", {
      userId: identity.subject,
      address: "Musterstraße 12, Berlin",
      purchaseDate: new Date().toISOString().slice(0, 10),
      valuationDate: new Date().toISOString().slice(0, 10),
      propertyType: "apartment",
      regionKey: "DE-BE",
      microLocationScore: 0.72,
      livingArea: 68,
      landArea: 120,
      parkingSpaces: 1,
      yearBuilt: 1998,
      modernizationYear: 2018,
      remainingUsefulLife: 55,
      energyClass: "C",
      heatingType: "gas",
      co2CostSplitLandlord: 0.5,
      rentLevelClass: "gut",
      vacancyMicroRisk: 0.03,
      latitude: 52.520008,
      longitude: 13.404954,
      geoConfidence: 0.8,
      geoResolvedAt: new Date().toISOString(),
      adminCountryCode: "DE",
      adminState: "Berlin",
      adminCounty: "Berlin",
      adminCity: "Berlin",
      osmPlaceId: "",
      displayName: "Berlin, Deutschland",
      boundaryGeoJson: "",
      shortCode: "DEMO01",
      purchasePrice: 285000,
      brokerFeePercent: 0.0357,
      notaryFeePercent: 0.015,
      landRegistryPercent: 0.005,
      transferTaxPercent: 0.06,
      otherCostsPercent: 0,
      initialInvestments: [
        { name: "Renovierung", cost: 12000, taxTreatment: "activate", valueIncrease: 5000 },
      ],
      coldRentPerSqm: 12.5,
      parkingRent: 60,
      otherRent: 0,
      transferableCosts: 180,
      hausgeldTotal: 340,
      hausgeldTransferable: 200,
      wegReserve: 45,
      propertyTax: 28,
      otherOperatingCosts: 35,
      vacancyReservePercent: 0.03,
      maintenanceReservePerSqm: 12,
      depreciationRate: 0.02,
      buildingSharePercent: 0.75,
      personalTaxRate: 0.42,
      loan1Amount: 230000,
      loan1InterestRate: 0.036,
      loan1InitialRepayment: 0.02,
      loan1InterestChanges: [],
      loan1RepaymentChanges: [],
      loan1SpecialRepayments: [],
      loan2Amount: 10000,
      loan2InterestRate: 0.055,
      loan2InitialRepayment: 0.03,
      loan2InterestChanges: [],
      loan2RepaymentChanges: [],
      loan2SpecialRepayments: [],
      costIncreasePercent: 0.03,
      rentIncreasePercent: 0.02,
      valueIncreasePercent: 0.02,
      projectionYear: new Date().getFullYear() + 10,
    });
  },
});
