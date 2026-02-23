export function buildGeoCacheKey(parts: Record<string, string | number>) {
  const serialized = Object.entries(parts)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return serialized;
}

export function isCacheValid(expiresAtIso: string) {
  return Date.parse(expiresAtIso) > Date.now();
}

export function ttlIso(days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return expires.toISOString();
}
