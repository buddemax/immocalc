import { describe, expect, it } from "vitest";
import { DEFAULT_PROPERTY } from "@/lib/domain/property";
import { buildValuationInput } from "@/lib/calculations/valuation/fromProperty";

describe("valuation source priority", () => {
  it("prefers API land value over manual data", () => {
    const input = buildValuationInput(
      {
        ...DEFAULT_PROPERTY,
        regionKey: "DE-BB",
      },
      [
        {
          metric: "land_value_per_sqm",
          value: 420,
          unit: "eur_per_sqm",
          sourceType: "manual",
          sourceLabel: "manual",
          effectiveDate: "2026-01-01",
          confidence: 0.9,
          regionKey: "DE-BB",
        },
        {
          metric: "land_value_per_sqm",
          value: 610,
          unit: "eur_per_sqm",
          sourceType: "api_boris",
          sourceLabel: "BORIS",
          effectiveDate: "2025-01-01",
          confidence: 0.6,
          regionKey: "DE-BB",
        },
      ],
    );

    expect(input.landValuePerSqm).toBe(610);
  });
});
