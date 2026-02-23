import { calcOperatingCosts, calcRent } from "@/lib/calculations/core";
import { PropertyInput, pickPropertyInput } from "@/lib/domain/property";
import { MarketDataSnapshot, ValuationInput } from "@/lib/domain/valuation";

function findMetric(
  snapshots: MarketDataSnapshot[],
  metric: MarketDataSnapshot["metric"],
  fallback: number,
  regionKey: string,
) {
  const sourcePriority: Record<MarketDataSnapshot["sourceType"], number> = {
    api_boris: 5,
    api_geo: 4,
    manual: 3,
    csv_import: 2,
    internal_default: 1,
  };

  const scoped = snapshots
    .filter((item) => item.metric === metric && (item.regionKey === regionKey || item.regionKey === "DE"))
    .sort((a, b) => {
      const bySource = sourcePriority[b.sourceType] - sourcePriority[a.sourceType];
      if (bySource !== 0) return bySource;
      if (a.effectiveDate !== b.effectiveDate) return a.effectiveDate > b.effectiveDate ? -1 : 1;
      return b.confidence - a.confidence;
    });
  return scoped[0]?.value ?? fallback;
}

function defaultReplacementCostPerSqm(property: PropertyInput) {
  if (property.yearBuilt >= 2010) return 2100;
  if (property.yearBuilt >= 1990) return 1700;
  if (property.yearBuilt >= 1970) return 1300;
  return 900;
}

export function buildValuationInput(
  rawProperty: PropertyInput | Record<string, unknown>,
  snapshots: MarketDataSnapshot[],
): ValuationInput {
  const property = pickPropertyInput(rawProperty as Record<string, unknown>);
  const rent = calcRent(property);
  const costs = calcOperatingCosts(property);

  const annualRent = rent.netColdRent * 12;
  const annualOpCostsNonTransferable = costs.nonTransferable * 12;

  const marketRentPerSqm = findMetric(
    snapshots,
    "market_rent_per_sqm",
    property.coldRentPerSqm,
    property.regionKey,
  );
  const capRate = findMetric(snapshots, "cap_rate", 0.04, property.regionKey);
  const landValuePerSqm = findMetric(snapshots, "land_value_per_sqm", 550, property.regionKey);
  const materialFactor = findMetric(snapshots, "material_factor", 1, property.regionKey);
  const poiTransitCount = findMetric(snapshots, "poi_transit_1km", 0, property.regionKey);
  const poiSchoolCount = findMetric(snapshots, "poi_school_1km", 0, property.regionKey);
  const poiSupermarketCount = findMetric(snapshots, "poi_supermarket_1km", 0, property.regionKey);
  const distanceTransitMeters = findMetric(snapshots, "distance_transit_m", 800, property.regionKey);
  const poiBoost = Math.min(0.12, poiTransitCount * 0.015 + poiSchoolCount * 0.01 + poiSupermarketCount * 0.008);
  const distancePenalty = Math.max(0, (distanceTransitMeters - 400) / 3000) * 0.08;
  const adjustedMicroLocation = Math.max(0.2, Math.min(0.98, property.microLocationScore + poiBoost - distancePenalty));

  const comparableSaleMetric = snapshots
    .filter((item) => item.metric === "property_price_per_sqm")
    .sort((a, b) => (a.effectiveDate > b.effectiveDate ? -1 : 1));

  return {
    valuationDate: property.valuationDate,
    regionKey: property.regionKey,
    livingArea: property.livingArea,
    landArea: Math.max(property.landArea, property.livingArea * 0.3),
    yearBuilt: property.yearBuilt,
    remainingUsefulLife: property.remainingUsefulLife,
    microLocationScore: adjustedMicroLocation,
    netOperatingIncomeAnnual: annualRent - annualOpCostsNonTransferable,
    maintenanceAnnual: property.maintenanceReservePerSqm * property.livingArea,
    marketRentPerSqm,
    capRate,
    landValuePerSqm,
    replacementCostPerSqm: defaultReplacementCostPerSqm(property),
    materialFactor,
    comparableSales: comparableSaleMetric.map((item) => ({
      pricePerSqm: item.value,
      livingArea: property.livingArea,
      distanceKm: 2.5,
      conditionScore: Math.max(0.6, Math.min(1.2, item.confidence + 0.3)),
      yearBuilt: property.yearBuilt,
    })),
  };
}
