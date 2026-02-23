import { ErtragswertResult, ValuationInput } from "@/lib/domain/valuation";
import { calcBand, clamp } from "@/lib/calculations/valuation/common";

function calcCapitalizer(capRate: number, years: number) {
  if (capRate <= 0) {
    return years;
  }
  const factor = (1 - Math.pow(1 + capRate, -years)) / capRate;
  return Number.isFinite(factor) ? factor : years;
}

export function calcErtragswert(input: ValuationInput): ErtragswertResult {
  const warnings: string[] = [];
  const capRate = clamp(input.capRate, 0.015, 0.12);

  if (input.capRate !== capRate) {
    warnings.push("Liegenschaftszinssatz wurde in den zulässigen Bereich geclamped.");
  }

  const annualReinertrag = Math.max(0, input.netOperatingIncomeAnnual - input.maintenanceAnnual);
  const landValue = Math.max(0, input.landArea * input.landValuePerSqm);
  const landValueYield = landValue * capRate;
  const buildingReinertrag = annualReinertrag - landValueYield;
  const capitalizer = calcCapitalizer(capRate, Math.max(1, input.remainingUsefulLife));
  const buildingValue = Math.max(0, buildingReinertrag * capitalizer);
  const value = Math.max(0, landValue + buildingValue);

  if (buildingReinertrag < 0) {
    warnings.push("Gebäudereinertrag ist negativ; Ertragswert stark landwertgetrieben.");
  }

  const confidenceSpread = 0.16 - clamp(input.microLocationScore, 0, 1) * 0.09;
  const { bandLow, bandHigh } = calcBand(value, confidenceSpread);

  return {
    method: "ertragswert",
    annualReinertrag,
    landValue,
    buildingValue,
    capitalizer,
    value,
    bandLow,
    bandHigh,
    qualityScore: clamp(0.5 + input.microLocationScore * 0.45, 0.3, 0.98),
    warnings,
  };
}
