import { BorisNormalizedRecord, BorisProviderAdapter, BorisQueryInput, BorisRawFeature } from "@/lib/domain/boris";

const BRANDENBURG_BASE_URL = "https://ogc-api.geobasis-bb.de/boris";
const COLLECTION_ID = "br_bodenrichtwert";

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function parseFeaturePoint(feature: BorisRawFeature): { lat: number; lon: number } | null {
  const geometry = feature.geometry;
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return null;
  }

  if (geometry.type === "Point" && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    const lon = Number(geometry.coordinates[0]);
    const lat = Number(geometry.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }

  return null;
}

function weightedMedian(samples: Array<{ value: number; weight: number }>) {
  const sorted = [...samples].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0 || sorted.length === 0) {
    return 0;
  }

  let acc = 0;
  for (const item of sorted) {
    acc += item.weight;
    if (acc >= total / 2) {
      return item.value;
    }
  }

  return sorted[sorted.length - 1].value;
}

function parseBodenrichtwert(properties: Record<string, unknown>) {
  const raw = properties.bodenrichtwert;
  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "string") {
    const parsed = Number(raw.replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function parseDate(properties: Record<string, unknown>, fallback: string) {
  const raw = properties.stichtag;
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  return fallback;
}

export function createBorisBbox(lat: number, lon: number, delta = 0.012) {
  const minLon = lon - delta;
  const minLat = lat - delta;
  const maxLon = lon + delta;
  const maxLat = lat + delta;
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

export function mapBrandenburgFeatures(
  features: BorisRawFeature[],
  center: { lat: number; lon: number },
  asOfDate: string,
  requestUrl: string,
): BorisNormalizedRecord | null {
  const samples = features
    .map((feature) => {
      const props = feature.properties ?? {};
      const value = parseBodenrichtwert(props);
      if (!value || value <= 0) {
        return null;
      }

      const point = parseFeaturePoint(feature);
      const distance = point ? distanceMeters(center.lat, center.lon, point.lat, point.lon) : 1500;
      const weight = 1 / (1 + distance / 400);

      return {
        value,
        weight,
        distance,
        municipality: typeof props.gemeinde_bezeichnung === "string" ? props.gemeinde_bezeichnung : undefined,
        zoneId: typeof props.bodenrichtwertNummer === "string" ? props.bodenrichtwertNummer : undefined,
        effectiveDate: parseDate(props, asOfDate),
      };
    })
    .filter((sample): sample is NonNullable<typeof sample> => Boolean(sample));

  if (samples.length === 0) {
    return null;
  }

  const median = weightedMedian(samples.map((item) => ({ value: item.value, weight: item.weight })));
  const nearest = Math.min(...samples.map((item) => item.distance));
  const confidence = Math.max(0.35, Math.min(0.95, 0.35 + Math.min(samples.length, 10) * 0.05 + (nearest < 250 ? 0.15 : 0)));

  return {
    valueEurPerSqm: median,
    effectiveDate: samples[0].effectiveDate,
    municipality: samples.find((item) => item.municipality)?.municipality,
    zoneId: samples.find((item) => item.zoneId)?.zoneId,
    distanceMeters: nearest,
    sourceUrl: requestUrl,
    confidence,
    sampleSize: samples.length,
  };
}

export class BrandenburgBorisAdapter implements BorisProviderAdapter {
  stateCode = "BB";
  providerType = "boris_ogc";

  async fetchLandValue(input: BorisQueryInput): Promise<BorisNormalizedRecord | null> {
    const params = new URLSearchParams({
      f: "json",
      limit: "50",
      bbox: createBorisBbox(input.lat, input.lon),
      stichtag: input.asOfDate,
      sortby: "-bodenrichtwert",
    });

    const requestUrl = `${BRANDENBURG_BASE_URL}/collections/${COLLECTION_ID}/items?${params.toString()}`;
    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/geo+json,application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`BORIS Brandenburg request failed with status ${response.status}`);
    }

    const body = (await response.json()) as { features?: BorisRawFeature[] };
    return mapBrandenburgFeatures(body.features ?? [], { lat: input.lat, lon: input.lon }, input.asOfDate, requestUrl);
  }
}
