import { MethodResult, ValuationSuiteResult } from "@/lib/domain/valuation";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calcBand(value: number, spread: number) {
  const boundedSpread = clamp(spread, 0.03, 0.3);
  return {
    bandLow: value * (1 - boundedSpread),
    bandHigh: value * (1 + boundedSpread),
  };
}

export function mergeWarnings(...warningSets: string[][]) {
  return [...new Set(warningSets.flat())];
}

export function aggregateQuality(...results: MethodResult[]) {
  if (results.length === 0) {
    return 0;
  }
  return results.reduce((sum, item) => sum + item.qualityScore, 0) / results.length;
}

export function aggregateSuiteWarnings(suite: Pick<ValuationSuiteResult, "ertragswert" | "vergleichswert" | "sachwert">) {
  return mergeWarnings(suite.ertragswert.warnings, suite.vergleichswert.warnings, suite.sachwert.warnings);
}

export function weightedMean(values: number[], weights: number[]) {
  if (values.length === 0 || values.length !== weights.length) {
    return 0;
  }
  const totalWeight = weights.reduce((sum, item) => sum + item, 0);
  if (totalWeight <= 0) {
    return 0;
  }
  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / totalWeight;
}

export function weightedMedian(values: number[], weights: number[]) {
  if (values.length === 0 || values.length !== weights.length) {
    return 0;
  }

  const zipped = values
    .map((value, index) => ({ value, weight: Math.max(0, weights[index]) }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = zipped.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  let running = 0;
  for (const item of zipped) {
    running += item.weight;
    if (running >= totalWeight / 2) {
      return item.value;
    }
  }

  return zipped[zipped.length - 1]?.value ?? 0;
}

export function filterOutliersIqr(values: number[]) {
  if (values.length < 4) {
    return values;
  }

  const sorted = [...values].sort((a, b) => a - b);

  if (sorted.length < 6) {
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviations = sorted.map((value) => Math.abs(value - median)).sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)] || 1;
    const threshold = mad * 3;
    return sorted.filter((value) => Math.abs(value - median) <= threshold);
  }

  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return sorted.filter((value) => value >= lower && value <= upper);
}
