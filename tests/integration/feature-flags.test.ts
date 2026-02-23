import { describe, expect, it } from "vitest";
import { isFeatureEnabled } from "@/lib/featureFlags";

describe("feature flag gating", () => {
  it("locks pro features for free plan", () => {
    expect(isFeatureEnabled("free", "second_loan")).toBe(false);
    expect(isFeatureEnabled("free", "charts")).toBe(false);
    expect(isFeatureEnabled("free", "valuation_v2")).toBe(false);
    expect(isFeatureEnabled("free", "geo_boris_v1")).toBe(false);
  });

  it("unlocks pro features for pro plan", () => {
    expect(isFeatureEnabled("pro", "second_loan")).toBe(true);
    expect(isFeatureEnabled("pro", "bank_report")).toBe(true);
    expect(isFeatureEnabled("pro", "valuation_report")).toBe(true);
    expect(isFeatureEnabled("pro", "geo_boris_v1")).toBe(true);
  });
});
