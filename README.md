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

## Deploy auf Vercel (Frontend + FastAPI)

Die App läuft stabil als zwei Vercel-Projekte im selben Repo:

1. Frontend-Projekt (Root: `/Users/maxbudde/immocal`)
2. Backend (Root: `/Users/maxbudde/immocal/backend`)

### 1) Backend deployen (FastAPI)

- Siehe `/Users/maxbudde/immocal/backend/README.md`
- Ergebnis ist z. B. `https://<microlocation-backend>.vercel.app`

### 2) Convex-Env für den Backend-Call setzen

```bash
npx convex env set MICROLOCATION_FASTAPI_URL "https://<microlocation-backend>.vercel.app"
npx convex env set MICROLOCATION_SERVICE_TOKEN "<gleiches_token_wie_im_backend>"
npx convex env set MICROLOCATION_FASTAPI_EVALUATE_PATH "/v1/microlocation/evaluate"
```

### 3) Frontend deployen (Next.js)

Frontend-Env in Vercel setzen:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`
- optional `NEXT_PUBLIC_DEFAULT_LOCALE`, `NEXT_PUBLIC_DEFAULT_CURRENCY`

### Wichtig

- `MICROLOCATION_SERVICE_TOKEN` muss in FastAPI und Convex identisch sein.
- Keine API-Keys im Frontend hinterlegen (nur serverseitig: Convex/FastAPI).
