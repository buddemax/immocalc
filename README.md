# immocal

Immobilien-Kalkulator (immocation-inspiriert) mit Next.js, Convex und Clerk.

## Setup

1. `cp .env.example .env.local`
2. Werte eintragen
3. `npm install`
4. `npm run convex:dev`
5. `npm run dev`

Optional:
- Demo-Datensatz im Dashboard per Button anlegen
- Plan-Tier für Clerk-User über `claims.planTier` oder `claims.public_metadata.planTier` (`free`/`pro`)
- Für Geo-APIs einen `GEO_USER_AGENT` setzen (Nominatim Policy)

## Testen

- Unit/Integration: `npm run test`
- E2E: `npm run test:e2e`
