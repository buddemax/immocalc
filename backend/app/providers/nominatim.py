from typing import Optional

import httpx

from app.config import settings

NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'


async def geocode_address(address: str) -> Optional[dict]:
    params = {
        'q': address,
        'format': 'jsonv2',
        'addressdetails': '1',
        'limit': 1,
    }
    headers = {'User-Agent': settings.geo_user_agent, 'Accept': 'application/json'}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f'{NOMINATIM_BASE}/search', params=params, headers=headers)
        resp.raise_for_status()
        rows = resp.json()

    if not rows:
        return None

    row = rows[0]
    lat = float(row['lat'])
    lon = float(row['lon'])
    return {
        'lat': lat,
        'lon': lon,
        'display_name': row.get('display_name', ''),
        'importance': float(row.get('importance', 0.4) or 0.4),
        'country_code': ((row.get('address') or {}).get('country_code') or 'de').upper(),
        'state': (row.get('address') or {}).get('state', ''),
        'city': (row.get('address') or {}).get('city')
        or (row.get('address') or {}).get('town')
        or (row.get('address') or {}).get('village')
        or '',
    }
