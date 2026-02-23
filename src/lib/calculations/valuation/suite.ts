import {
  DEFAULT_SCENARIOS,
  RegulatoryParameterSet,
  ScenarioInput,
  ValuationInput,
  ValuationSuiteResult,
} from "@/lib/domain/valuation";
import { calcErtragswert } from "@/lib/calculations/valuation/ertragswert";
import { calcVergleichswert } from "@/lib/calculations/valuation/vergleichswert";
import { calcSachwert } from "@/lib/calculations/valuation/sachwert";
import { aggregateSuiteWarnings, clamp } from "@/lib/calculations/valuation/common";

export function applyScenario(input: ValuationInput, scenario: ScenarioInput): ValuationInput {
  return {
    ...input,
    netOperatingIncomeAnnual: input.netOperatingIncomeAnnual * (1 + scenario.rentDelta),
    maintenanceAnnual: input.maintenanceAnnual * (1 + scenario.costDelta),
    capRate: clamp(input.capRate + scenario.capRateDelta, 0.015, 0.12),
  };
}

export function pickScenario(scenarioId: string | undefined) {
  return DEFAULT_SCENARIOS.find((item) => item.id === scenarioId) ?? DEFAULT_SCENARIOS[0];
}

export function calcValuationSuite(input: ValuationInput, scenario: ScenarioInput): ValuationSuiteResult {
  const scenarioInput = applyScenario(input, scenario);

  const ertragswert = calcErtragswert(scenarioInput);
  const vergleichswert = calcVergleichswert(scenarioInput);
  const sachwert = calcSachwert(scenarioInput);

  const warnings = aggregateSuiteWarnings({ ertragswert, vergleichswert, sachwert });

  return {
    ertragswert,
    vergleichswert,
    sachwert,
    assumptions: {
      scenario: scenario.id,
      valuationDate: input.valuationDate,
      capRate: scenarioInput.capRate,
      marketRentPerSqm: scenarioInput.marketRentPerSqm,
      landValuePerSqm: scenarioInput.landValuePerSqm,
      microLocationScore: scenarioInput.microLocationScore,
    },
    warnings,
  };
}

export function getRegulatoryParams(
  regionKey: string,
  asOfDate: string,
  available: RegulatoryParameterSet[],
): RegulatoryParameterSet | null {
  const matchingRegion = available.filter((item) => item.regionKey === regionKey || item.regionKey === "DE");

  const inRange = matchingRegion.filter((item) => {
    const fromOk = item.validFrom <= asOfDate;
    const toOk = !item.validTo || item.validTo >= asOfDate;
    return fromOk && toOk;
  });

  if (inRange.length > 0) {
    return inRange.sort((a, b) => (a.validFrom > b.validFrom ? -1 : 1))[0];
  }

  return matchingRegion.sort((a, b) => (a.validFrom > b.validFrom ? -1 : 1))[0] ?? null;
}
