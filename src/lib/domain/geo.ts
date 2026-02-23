export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeoResolution {
  point: GeoPoint;
  displayName: string;
  osmPlaceId: string;
  confidence: number;
  countryCode: string;
  state?: string;
  county?: string;
  city?: string;
  raw?: Record<string, unknown>;
}

export interface BoundaryResult {
  geoJson: string;
  source: string;
}

export interface PoiInsight {
  key: "supermarket" | "school" | "transit" | "center";
  count1km?: number;
  nearestDistanceMeters?: number;
}

export interface GeoProviderResult {
  geocode: GeoResolution;
  boundary?: BoundaryResult;
}
