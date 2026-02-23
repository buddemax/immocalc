import { describe, expect, it } from "vitest";
import { CSVImportProvider, ManualProvider, parseMarketDataCsv } from "@/lib/data/providers/marketData";

describe("market data providers", () => {
  it("parses csv snapshots", async () => {
    const csv = [
      "metric,value,unit,sourceLabel,sourceUrl,effectiveDate,confidence,regionKey",
      "market_rent_per_sqm,13.4,eur_per_sqm,Mietspiegel,,2026-01-01,0.8,DE-BE",
      "cap_rate,0.041,percent,Gutachterausschuss,,2026-01-01,0.7,DE-BE",
    ].join("\n");

    const rows = parseMarketDataCsv(csv);
    expect(rows).toHaveLength(2);

    const provider = new CSVImportProvider(csv);
    const scoped = await provider.loadSnapshots({ regionKey: "DE-BE", asOfDate: "2026-02-01" });
    expect(scoped).toHaveLength(2);
  });

  it("filters manual provider by region", async () => {
    const provider = new ManualProvider([
      {
        metric: "land_value_per_sqm",
        value: 700,
        unit: "eur_per_sqm",
        sourceType: "manual",
        sourceLabel: "BORIS",
        effectiveDate: "2026-01-01",
        confidence: 0.9,
        regionKey: "DE-BE",
      },
      {
        metric: "cap_rate",
        value: 0.038,
        unit: "percent",
        sourceType: "manual",
        sourceLabel: "Markt",
        effectiveDate: "2026-01-01",
        confidence: 0.8,
        regionKey: "DE-HH",
      },
    ]);

    const rows = await provider.loadSnapshots({ regionKey: "DE-BE", asOfDate: "2026-02-01" });
    expect(rows).toHaveLength(1);
  });
});
