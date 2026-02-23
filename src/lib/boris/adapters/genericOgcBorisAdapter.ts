import { BorisNormalizedRecord, BorisProviderAdapter, BorisQueryInput, BorisRawFeature } from "@/lib/domain/boris";
import { createBorisBbox } from "@/lib/boris/adapters/brandenburgBorisAdapter";

function parseValue(properties: Record<string, unknown>) {
  const candidates = [
    properties.bodenrichtwert,
    properties.land_value_per_sqm,
    properties.value,
    properties.brw,
    properties.brw_eur_m2,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const parsed = Number(candidate.replace(",", "."));
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

export function mapGenericFeatures(
  features: BorisRawFeature[],
  requestUrl: string,
  asOfDate: string,
): BorisNormalizedRecord | null {
  const values = features
    .map((feature) => parseValue(feature.properties ?? {}))
    .filter((value): value is number => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return {
    valueEurPerSqm: median,
    effectiveDate: asOfDate,
    sourceUrl: requestUrl,
    confidence: Math.max(0.2, Math.min(0.8, 0.2 + values.length * 0.04)),
    sampleSize: values.length,
  };
}

export class GenericOgcBorisAdapter implements BorisProviderAdapter {
  constructor(
    public stateCode: string,
    public providerType: string,
    private baseUrl: string,
    private collectionId: string,
  ) {}

  async fetchLandValue(input: BorisQueryInput): Promise<BorisNormalizedRecord | null> {
    const params = new URLSearchParams({
      f: "json",
      limit: "50",
      bbox: createBorisBbox(input.lat, input.lon),
      sortby: "-bodenrichtwert",
    });

    if (input.asOfDate) {
      params.set("stichtag", input.asOfDate);
    }

    const requestUrl = `${this.baseUrl.replace(/\/$/, "")}/collections/${this.collectionId}/items?${params.toString()}`;
    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/geo+json,application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Generic BORIS request failed with status ${response.status}`);
    }

    const body = (await response.json()) as { features?: BorisRawFeature[] };
    return mapGenericFeatures(body.features ?? [], requestUrl, input.asOfDate);
  }
}
