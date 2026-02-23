export type PopulationClass =
  | "metropole"
  | "grossstadt"
  | "mittelstadt"
  | "kleinstadt"
  | "dorf"
  | "unknown";

export type MicroLocationRunStatus = "success" | "error";

export interface MicroLocationEvaluateRequest {
  schemaVersion: "v1";
  address: string;
  lat?: number;
  lon?: number;
  radiusPrimary?: number;
  radiusSecondary?: number;
  countryCode?: string;
}

export interface MicroLocationPoiSummary {
  supermarketsCount: number;
  nearestSupermarketMeters?: number;
  transitCount: number;
  nearestTransitMeters?: number;
  schoolsCount: number;
  nearestSchoolMeters?: number;
  parksCount: number;
  nearestParkMeters?: number;
}

export interface MicroLocationBreakdown {
  scoreOepnv: number;
  scoreEinkauf: number;
  scoreBildung: number;
  scoreFreizeit: number;
  gesamtScore: number;
  kurzbegruendung: string;
  confidence: number;
}

export interface MicroLocationEvaluateResult extends MicroLocationBreakdown {
  populationValue?: number;
  populationClass: PopulationClass;
  poiSummary: MicroLocationPoiSummary;
  sourceMeta: {
    geocodeProvider: string;
    poiProvider: string;
    populationSource: string;
  };
  providerMeta?: {
    model?: string;
  };
}
