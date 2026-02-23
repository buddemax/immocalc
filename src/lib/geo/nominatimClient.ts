import { GeoResolution } from "@/lib/domain/geo";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

function getUserAgent() {
  return process.env.GEO_USER_AGENT ?? "immocal/1.0 (geo@immocal.local)";
}

function mapAddressPart(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return "";
}

export function parseNominatimResult(row: Record<string, unknown>): GeoResolution | null {
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const importance = typeof row.importance === "number" ? row.importance : Number(row.importance ?? 0);
  const address = (row.address as Record<string, unknown> | undefined) ?? {};

  return {
    point: { lat, lon },
    displayName: typeof row.display_name === "string" ? row.display_name : "",
    osmPlaceId: String(row.place_id ?? ""),
    confidence: Math.max(0.2, Math.min(0.99, Number.isFinite(importance) ? importance : 0.4)),
    countryCode: mapAddressPart(address, "country_code").toUpperCase() || "DE",
    state: mapAddressPart(address, "state"),
    county: mapAddressPart(address, "county"),
    city: mapAddressPart(address, "city", "town", "village", "municipality"),
    raw: row,
  };
}

export async function nominatimSearchAddress(address: string): Promise<GeoResolution | null> {
  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    addressdetails: "1",
    polygon_geojson: "1",
    limit: "1",
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: {
      "User-Agent": getUserAgent(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Nominatim search failed with status ${response.status}`);
  }

  const rows = (await response.json()) as Record<string, unknown>[];
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return parseNominatimResult(rows[0]);
}

export async function nominatimReverse(point: { lat: number; lon: number }) {
  const params = new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lon),
    format: "jsonv2",
    addressdetails: "1",
    polygon_geojson: "1",
    zoom: "18",
  });

  const response = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
    headers: {
      "User-Agent": getUserAgent(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse failed with status ${response.status}`);
  }

  const row = (await response.json()) as Record<string, unknown>;
  const geocode = parseNominatimResult(row);
  if (!geocode) {
    return null;
  }

  return {
    geocode,
    geoJson:
      row.geojson && typeof row.geojson === "object"
        ? JSON.stringify(row.geojson)
        : JSON.stringify({ type: "Point", coordinates: [point.lon, point.lat] }),
  };
}
