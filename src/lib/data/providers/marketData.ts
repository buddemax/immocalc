import { MarketDataSnapshot } from "@/lib/domain/valuation";

export interface MarketDataProvider {
  sourceType: MarketDataSnapshot["sourceType"];
  loadSnapshots(input: { propertyId?: string; regionKey: string; asOfDate: string }): Promise<MarketDataSnapshot[]>;
}

export class ManualProvider implements MarketDataProvider {
  sourceType: MarketDataSnapshot["sourceType"] = "manual";

  constructor(private snapshots: MarketDataSnapshot[]) {}

  async loadSnapshots(input: { regionKey: string }): Promise<MarketDataSnapshot[]> {
    return this.snapshots.filter((item) => item.regionKey === input.regionKey || item.regionKey === "DE");
  }
}

export class CSVImportProvider implements MarketDataProvider {
  sourceType: MarketDataSnapshot["sourceType"] = "csv_import";

  constructor(private csvContent: string) {}

  async loadSnapshots(input: { regionKey: string; asOfDate: string }): Promise<MarketDataSnapshot[]> {
    return parseMarketDataCsv(this.csvContent)
      .filter((item) => item.regionKey === input.regionKey || item.regionKey === "DE")
      .filter((item) => item.effectiveDate <= input.asOfDate);
  }
}

export function parseMarketDataCsv(content: string): MarketDataSnapshot[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const header = splitCsvLine(lines[0]);
  const index = Object.fromEntries(header.map((name, idx) => [name, idx]));

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return {
      metric: (cols[index.metric] ?? "market_rent_per_sqm") as MarketDataSnapshot["metric"],
      value: Number(cols[index.value] ?? 0),
      unit: (cols[index.unit] ?? "eur_per_sqm") as MarketDataSnapshot["unit"],
      sourceType: "csv_import",
      sourceLabel: cols[index.sourceLabel] ?? "CSV Import",
      sourceUrl: cols[index.sourceUrl] ?? undefined,
      effectiveDate: cols[index.effectiveDate] ?? new Date().toISOString().slice(0, 10),
      confidence: Number(cols[index.confidence] ?? 0.6),
      regionKey: cols[index.regionKey] ?? "DE",
    };
  });
}

function splitCsvLine(line: string) {
  const delimiter = line.includes(";") ? ";" : ",";
  return line.split(delimiter).map((item) => item.trim());
}
