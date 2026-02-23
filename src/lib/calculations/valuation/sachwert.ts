import { SachwertResult, ValuationInput } from "@/lib/domain/valuation";
import { calcBand, clamp } from "@/lib/calculations/valuation/common";

export function calcSachwert(input: ValuationInput): SachwertResult {
  const warnings: string[] = [];
  const currentYear = Number.parseInt(input.valuationDate.slice(0, 4), 10) || new Date().getFullYear();
  const buildingAge = Math.max(0, currentYear - input.yearBuilt);

  const replacementCost = Math.max(0, input.livingArea * input.replacementCostPerSqm);
  const totalUsefulLife = Math.max(40, input.remainingUsefulLife + buildingAge);
  const depreciationFactor = clamp(1 - buildingAge / totalUsefulLife, 0.2, 1);

  if (depreciationFactor <= 0.25) {
    warnings.push("Hohe Alterswertminderung: Modernisierungsgrad prüfen.");
  }

  const landValue = Math.max(0, input.landArea * input.landValuePerSqm);
  const preliminarySachwert = replacementCost * depreciationFactor + landValue;
  const adjustedMaterialFactor = clamp(input.materialFactor * (0.9 + input.microLocationScore * 0.2), 0.8, 1.4);
  const value = preliminarySachwert * adjustedMaterialFactor;

  const spread = 0.12 - clamp(input.microLocationScore, 0, 1) * 0.04;
  const { bandLow, bandHigh } = calcBand(value, spread);

  return {
    method: "sachwert",
    replacementCost,
    depreciationFactor,
    adjustedMaterialFactor,
    value,
    bandLow,
    bandHigh,
    qualityScore: clamp(0.55 + input.microLocationScore * 0.25, 0.4, 0.95),
    warnings,
  };
}
