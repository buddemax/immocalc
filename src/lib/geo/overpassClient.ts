import { PoiInsight } from "@/lib/domain/geo";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

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

function parseElements(elements: Record<string, unknown>[], center: { lat: number; lon: number }) {
  return elements
    .map((item) => {
      const lat = Number(item.lat ?? (item.center as Record<string, unknown> | undefined)?.lat);
      const lon = Number(item.lon ?? (item.center as Record<string, unknown> | undefined)?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }
      return {
        distance: distanceMeters(center.lat, center.lon, lat, lon),
      };
    })
    .filter((item): item is { distance: number } => Boolean(item));
}

async function queryOverpass(query: string) {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: `data=${encodeURIComponent(query)}`,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { elements?: Record<string, unknown>[] };
  return body.elements ?? [];
}

export async function fetchPoiInsights(point: { lat: number; lon: number }, radiusMeters = 1000): Promise<PoiInsight[]> {
  const scripts = {
    supermarket: `[out:json][timeout:25];(node["shop"="supermarket"](around:${radiusMeters},${point.lat},${point.lon});way["shop"="supermarket"](around:${radiusMeters},${point.lat},${point.lon}););out center;`,
    school: `[out:json][timeout:25];(node["amenity"="school"](around:${radiusMeters},${point.lat},${point.lon});way["amenity"="school"](around:${radiusMeters},${point.lat},${point.lon}););out center;`,
    transit: `[out:json][timeout:25];(node["public_transport"](around:${radiusMeters},${point.lat},${point.lon});node["railway"="station"](around:${radiusMeters},${point.lat},${point.lon});node["highway"="bus_stop"](around:${radiusMeters},${point.lat},${point.lon}););out center;`,
  };

  const [supermarkets, schools, transit] = await Promise.all([
    queryOverpass(scripts.supermarket),
    queryOverpass(scripts.school),
    queryOverpass(scripts.transit),
  ]);

  const supermarketParsed = parseElements(supermarkets, point);
  const schoolParsed = parseElements(schools, point);
  const transitParsed = parseElements(transit, point);

  const nearestTransit = transitParsed.length > 0 ? Math.min(...transitParsed.map((item) => item.distance)) : undefined;

  return [
    {
      key: "supermarket",
      count1km: supermarketParsed.length,
    },
    {
      key: "school",
      count1km: schoolParsed.length,
    },
    {
      key: "transit",
      count1km: transitParsed.length,
      nearestDistanceMeters: nearestTransit,
    },
  ];
}
