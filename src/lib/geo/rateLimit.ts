const nextAllowedAt = new Map<string, number>();

export async function waitForRateLimit(key: string, minIntervalMs: number) {
  const now = Date.now();
  const allowedAt = nextAllowedAt.get(key) ?? 0;
  const waitMs = Math.max(0, allowedAt - now);

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  nextAllowedAt.set(key, Date.now() + minIntervalMs);
}
