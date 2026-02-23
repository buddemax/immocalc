from typing import Literal, Optional

from pydantic import BaseModel, Field


PopulationClass = Literal['metropole', 'grossstadt', 'mittelstadt', 'kleinstadt', 'dorf', 'unknown']


class EvaluateRequest(BaseModel):
    schemaVersion: Literal['v1'] = 'v1'
    address: str = Field(min_length=3)
    lat: Optional[float] = None
    lon: Optional[float] = None
    radiusPrimary: int = Field(default=500, ge=200, le=3000)
    radiusSecondary: int = Field(default=1000, ge=500, le=5000)
    countryCode: str = Field(default='DE', min_length=2, max_length=2)


class PoiSummary(BaseModel):
    supermarkets_count: int = 0
    nearest_supermarket_meters: Optional[float] = None
    transit_count: int = 0
    nearest_transit_meters: Optional[float] = None
    schools_count: int = 0
    nearest_school_meters: Optional[float] = None
    parks_count: int = 0
    nearest_park_meters: Optional[float] = None


class SourceMeta(BaseModel):
    geocode_provider: str = 'nominatim'
    poi_provider: str = 'overpass'
    population_source: str = 'osm_unknown'


class EvaluateResponse(BaseModel):
    schemaVersion: Literal['v1'] = 'v1'
    score_oepnv: float = Field(ge=1, le=10)
    score_einkauf: float = Field(ge=1, le=10)
    score_bildung: float = Field(ge=1, le=10)
    score_freizeit: float = Field(ge=1, le=10)
    gesamt_score: float = Field(ge=1, le=10)
    kurzbegruendung: str
    confidence: float = Field(ge=0, le=1)
    population_value: Optional[int] = None
    population_class: PopulationClass = 'unknown'
    poi_summary: PoiSummary
    source_meta: SourceMeta
    model: Optional[str] = None
