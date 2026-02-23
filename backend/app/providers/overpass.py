import asyncio
from typing import Optional

import httpx

from app.config import settings

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


def _distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import atan2, cos, radians, sin, sqrt

    earth_radius = 6371000
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius * c


def _parse_elements(elements: list[dict], center_lat: float, center_lon: float) -> list[float]:
    out: list[float] = []
    for element in elements:
        lat = element.get('lat') or (element.get('center') or {}).get('lat')
        lon = element.get('lon') or (element.get('center') or {}).get('lon')
        if lat is None or lon is None:
            continue
        out.append(_distance_meters(center_lat, center_lon, float(lat), float(lon)))
    return out


async def _query_overpass(query: str) -> list[dict]:
    errors: list[str] = []
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": settings.geo_user_agent,
    }

    for endpoint in OVERPASS_URLS:
        delay = 0.7
        for attempt in range(1, 3):
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(endpoint, headers=headers, data={"data": query})
                if resp.status_code == 429:
                    errors.append(f"{endpoint} attempt {attempt}: 429")
                    await asyncio.sleep(delay)
                    delay *= 2
                    continue
                if resp.status_code >= 500:
                    errors.append(f"{endpoint} attempt {attempt}: {resp.status_code}")
                    await asyncio.sleep(delay)
                    delay *= 2
                    continue

                resp.raise_for_status()
                body = resp.json()
                return body.get("elements") or []
            except httpx.HTTPError as exc:
                errors.append(f"{endpoint} attempt {attempt}: {exc}")
                await asyncio.sleep(delay)
                delay *= 2

    raise RuntimeError(f"All Overpass providers failed: {' | '.join(errors)}")


def _population_class(value: Optional[int]) -> str:
    if value is None:
        return 'unknown'
    if value >= 500_000:
        return 'metropole'
    if value >= 100_000:
        return 'grossstadt'
    if value >= 20_000:
        return 'mittelstadt'
    if value >= 5_000:
        return 'kleinstadt'
    return 'dorf'


async def fetch_population(lat: float, lon: float) -> tuple[Optional[int], str, str]:
    # administrative boundaries near the point with optional population tags
    query = f'''[out:json][timeout:25];
(
  relation["boundary"="administrative"](around:3000,{lat},{lon});
  area(around:3000,{lat},{lon})["population"];
);
out tags 20;'''
    try:
        elements = await _query_overpass(query)
    except Exception:
        return None, 'unknown', 'osm_unknown'

    population: Optional[int] = None
    for element in elements:
        tags = element.get('tags') or {}
        raw = tags.get('population')
        if raw is None:
            continue
        try:
            parsed = int(str(raw).replace('.', '').replace(',', ''))
        except ValueError:
            continue
        if population is None or parsed > population:
            population = parsed

    return population, _population_class(population), 'osm_population'


async def fetch_poi_summary(lat: float, lon: float, radius_primary: int, radius_secondary: int) -> dict:
    scripts = {
        'supermarket': f'''[out:json][timeout:25];(
node["shop"="supermarket"](around:{radius_primary},{lat},{lon});
way["shop"="supermarket"](around:{radius_primary},{lat},{lon});
);out center;''',
        'transit': f'''[out:json][timeout:25];(
node["public_transport"](around:{radius_primary},{lat},{lon});
node["railway"="station"](around:{radius_primary},{lat},{lon});
node["highway"="bus_stop"](around:{radius_primary},{lat},{lon});
);out center;''',
        'school': f'''[out:json][timeout:25];(
node["amenity"="school"](around:{radius_secondary},{lat},{lon});
way["amenity"="school"](around:{radius_secondary},{lat},{lon});
);out center;''',
        'park': f'''[out:json][timeout:25];(
node["leisure"="park"](around:{radius_secondary},{lat},{lon});
way["leisure"="park"](around:{radius_secondary},{lat},{lon});
);out center;''',
    }

    supermarkets, transit, schools, parks = await asyncio.gather(
        _query_overpass(scripts['supermarket']),
        _query_overpass(scripts['transit']),
        _query_overpass(scripts['school']),
        _query_overpass(scripts['park']),
    )

    supermarket_distances = _parse_elements(supermarkets, lat, lon)
    transit_distances = _parse_elements(transit, lat, lon)
    school_distances = _parse_elements(schools, lat, lon)
    park_distances = _parse_elements(parks, lat, lon)

    return {
        'supermarkets_count': len(supermarket_distances),
        'nearest_supermarket_meters': min(supermarket_distances) if supermarket_distances else None,
        'transit_count': len(transit_distances),
        'nearest_transit_meters': min(transit_distances) if transit_distances else None,
        'schools_count': len(school_distances),
        'nearest_school_meters': min(school_distances) if school_distances else None,
        'parks_count': len(park_distances),
        'nearest_park_meters': min(park_distances) if park_distances else None,
    }
