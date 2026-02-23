export interface BorisQueryInput {
  stateCode: string;
  lat: number;
  lon: number;
  asOfDate: string;
}

export interface BorisRawFeature {
  id?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
}

export interface BorisNormalizedRecord {
  valueEurPerSqm: number;
  effectiveDate: string;
  municipality?: string;
  zoneId?: string;
  distanceMeters?: number;
  sourceUrl: string;
  confidence: number;
  sampleSize: number;
}

export interface BorisProviderAdapter {
  stateCode: string;
  providerType: string;
  fetchLandValue(input: BorisQueryInput): Promise<BorisNormalizedRecord | null>;
}
