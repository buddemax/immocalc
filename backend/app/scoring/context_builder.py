from app.models import PoiSummary


def build_location_context(
    address: str,
    population_value: int | None,
    population_class: str,
    poi_summary: PoiSummary,
) -> str:
    population_txt = (
        f'Gemeinde mit {population_value:,} Einwohnern ({population_class}).'.replace(',', '.')
        if population_value is not None
        else f'Einwohnerzahl unbekannt ({population_class}).'
    )

    return (
        f'Objekt-Standort: {address}. {population_txt} '
        f'Im Umkreis von 500m befinden sich: '
        f'{poi_summary.supermarkets_count} Supermärkte (nächster: {round(poi_summary.nearest_supermarket_meters or 0)}m), '
        f'{poi_summary.transit_count} ÖPNV-Haltestellen (nächste: {round(poi_summary.nearest_transit_meters or 0)}m). '
        f'Im Umkreis von 1000m: '
        f'{poi_summary.schools_count} Schulen (nächste: {round(poi_summary.nearest_school_meters or 0)}m), '
        f'{poi_summary.parks_count} Parks (nächster: {round(poi_summary.nearest_park_meters or 0)}m).'
    )
