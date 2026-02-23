import time

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import require_service_token
from app.models import EvaluateRequest, EvaluateResponse, PoiSummary, SourceMeta
from app.providers.nominatim import geocode_address
from app.providers.overpass import fetch_poi_summary, fetch_population
from app.scoring.context_builder import build_location_context
from app.scoring.gemini_client import call_gemini
from app.scoring.rules import compute_rule_scores

router = APIRouter(prefix="/v1/microlocation", tags=["microlocation"])


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(payload: EvaluateRequest, _: None = Depends(require_service_token)):
    start = time.perf_counter()

    lat = payload.lat
    lon = payload.lon
    geocode_provider = "nominatim"

    if lat is None or lon is None:
        geocode = await geocode_address(payload.address)
        if not geocode:
            raise HTTPException(status_code=404, detail="Adresse konnte nicht geokodiert werden.")
        lat = geocode["lat"]
        lon = geocode["lon"]

    try:
        poi_summary_raw = await fetch_poi_summary(lat, lon, payload.radiusPrimary, payload.radiusSecondary)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"POI-Abfrage fehlgeschlagen: {exc}") from exc

    population_value, population_class, population_source = await fetch_population(lat, lon)

    poi_summary = PoiSummary(**poi_summary_raw)
    rule_scores = compute_rule_scores(population_class, poi_summary_raw)
    context_text = build_location_context(
        address=payload.address,
        population_value=population_value,
        population_class=population_class,
        poi_summary=poi_summary,
    )

    try:
        llm_scores = call_gemini(context_text=context_text, rule_baseline=rule_scores)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini-Scoring fehlgeschlagen: {exc}") from exc

    merged = {
        **rule_scores,
        **llm_scores,
    }

    source_meta = SourceMeta(
        geocode_provider=geocode_provider,
        poi_provider="overpass",
        population_source=population_source,
    )

    confidence = merged.get("confidence", 0.65)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    return EvaluateResponse(
        schemaVersion="v1",
        score_oepnv=merged["score_oepnv"],
        score_einkauf=merged["score_einkauf"],
        score_bildung=merged["score_bildung"],
        score_freizeit=merged["score_freizeit"],
        gesamt_score=merged["gesamt_score"],
        kurzbegruendung=merged.get("kurzbegruendung", "Automatische Bewertung anhand der verfügbaren Standortdaten."),
        confidence=max(0, min(1, float(confidence))),
        population_value=population_value,
        population_class=population_class,
        poi_summary=poi_summary,
        source_meta=source_meta,
        model=merged.get("model"),
    )

