from typing import Optional


def _clamp_score(value: float) -> float:
    return round(max(1.0, min(10.0, value)), 2)


def _distance_score(distance: Optional[float], excellent: float, good: float, okay: float, weak: float) -> float:
    if distance is None:
        return 2.5
    if distance <= excellent:
        return 10
    if distance <= good:
        return 8.5
    if distance <= okay:
        return 6.5
    if distance <= weak:
        return 4.5
    return 2.5


def _thresholds_for_population(population_class: str) -> tuple[float, float, float, float]:
    if population_class in ('metropole', 'grossstadt'):
        return (300, 450, 700, 1000)
    if population_class == 'mittelstadt':
        return (400, 600, 900, 1300)
    return (600, 800, 1100, 1500)


def compute_rule_scores(population_class: str, poi_summary: dict) -> dict:
    oepnv_thresholds = _thresholds_for_population(population_class)
    score_oepnv = _distance_score(poi_summary.get('nearest_transit_meters'), *oepnv_thresholds)

    score_einkauf = _distance_score(
        poi_summary.get('nearest_supermarket_meters'),
        250,
        500,
        800,
        1200,
    )

    score_bildung = _distance_score(
        poi_summary.get('nearest_school_meters'),
        300,
        700,
        1200,
        1800,
    )

    score_freizeit = _distance_score(
        poi_summary.get('nearest_park_meters'),
        250,
        600,
        1000,
        1600,
    )

    # Count-based fine tuning
    score_oepnv += min(1.2, (poi_summary.get('transit_count', 0) or 0) * 0.15)
    score_einkauf += min(1.0, (poi_summary.get('supermarkets_count', 0) or 0) * 0.2)
    score_bildung += min(0.8, (poi_summary.get('schools_count', 0) or 0) * 0.2)
    score_freizeit += min(0.8, (poi_summary.get('parks_count', 0) or 0) * 0.2)

    score_oepnv = _clamp_score(score_oepnv)
    score_einkauf = _clamp_score(score_einkauf)
    score_bildung = _clamp_score(score_bildung)
    score_freizeit = _clamp_score(score_freizeit)

    gesamt = _clamp_score(
        score_oepnv * 0.35
        + score_einkauf * 0.30
        + score_bildung * 0.20
        + score_freizeit * 0.15
    )

    return {
        'score_oepnv': score_oepnv,
        'score_einkauf': score_einkauf,
        'score_bildung': score_bildung,
        'score_freizeit': score_freizeit,
        'gesamt_score': gesamt,
    }
