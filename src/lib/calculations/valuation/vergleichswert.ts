import { ComparableSaleInput, VergleichswertResult, ValuationInput } from "@/lib/domain/valuation";
import { calcBand, clamp, filterOutliersIqr, weightedMedian } from "@/lib/calculations/valuation/common";

function compWeight(comp: ComparableSaleInput, targetYearBuilt: number) {
  const distancePenalty = 1 / (1 + comp.distanceKm);
  const conditionWeight = clamp(comp.conditionScore, 0.3, 1.2);
  const ageDistance = Math.abs(comp.yearBuilt - targetYearBuilt);
  const ageWeight = 1 / (1 + ageDistance / 20);
  return distancePenalty * conditionWeight * ageWeight;
}

export function calcVergleichswert(input: ValuationInput): VergleichswertResult {
  const warnings: string[] = [];
  if (input.comparableSales.length === 0) {
    const fallbackValue = input.marketRentPerSqm * 12 * input.livingArea * 20;
    const { bandLow, bandHigh } = calcBand(fallbackValue, 0.24);
    return {
      method: "vergleichswert",
      comparableCount: 0,
      weightedMedianPricePerSqm: fallbackValue / Math.max(1, input.livingArea),
      value: fallbackValue,
      bandLow,
      bandHigh,
      qualityScore: 0.25,
      warnings: ["Keine Vergleichsobjekte vorhanden; heuristischer Fallback verwendet."],
    };
  }

  const rawPrices = input.comparableSales.map((item) => item.pricePerSqm);
  const filtered = filterOutliersIqr(rawPrices);

  const filteredComps = input.comparableSales.filter((item) => filtered.includes(item.pricePerSqm));
  if (filteredComps.length < input.comparableSales.length) {
    warnings.push("Ausreißer wurden aus den Vergleichsobjekten entfernt.");
  }

  const prices = filteredComps.map((item) => item.pricePerSqm);
  const weights = filteredComps.map((item) => compWeight(item, input.yearBuilt));

  const medianPricePerSqm = weightedMedian(prices, weights);
  const locationAdjustment = 0.88 + clamp(input.microLocationScore, 0, 1) * 0.24;
  const value = medianPricePerSqm * input.livingArea * locationAdjustment;

  const samplePenalty = Math.max(0, 1 - filteredComps.length / 8);
  const spread = 0.09 + samplePenalty * 0.12;
  const { bandLow, bandHigh } = calcBand(value, spread);

  return {
    method: "vergleichswert",
    comparableCount: filteredComps.length,
    weightedMedianPricePerSqm: medianPricePerSqm,
    value,
    bandLow,
    bandHigh,
    qualityScore: clamp(0.45 + filteredComps.length * 0.07 - samplePenalty * 0.2, 0.3, 0.95),
    warnings,
  };
}
