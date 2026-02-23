# immocal backend

Zentraler FastAPI-Backend-Service für `immocal`.
Aktuell ist das Mikrolage-Modul enthalten (Nominatim + Overpass + Gemini).
Weitere Backend-Features werden im selben Service ergänzt (neue Router unter `app/routers`).

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

```bash
export MICROLOCATION_SERVICE_TOKEN=change-me
export GEMINI_API_KEY=...
export GEMINI_MODEL=gemini-1.5-flash
export GEO_USER_AGENT='immocal-microlocation/1.0 (geo@example.com)'
```

## Run

```bash
uvicorn app.main:app --reload --port 8100
```

## API

- `GET /health`
- `POST /v1/microlocation/evaluate`

`POST /v1/microlocation/evaluate` erwartet Bearer Token (`MICROLOCATION_SERVICE_TOKEN`) wenn gesetzt.

## Vercel Deploy (eigenes Projekt)

Dieses Backend wird als separates Vercel-Projekt mit Root-Directory `backend` deployed.

1. In Vercel ein neues Projekt aus demselben Repo anlegen.
2. `Root Directory` auf `backend` setzen.
3. Environment Variables setzen:
   - `MICROLOCATION_SERVICE_TOKEN`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional, default `gemini-1.5-flash`)
   - `GEO_USER_AGENT`
4. Deploy auslösen.

Hinweis:
- `vercel.json` routet `/health` und `/v1/*` auf die FastAPI-App.
- Die Backend-URL wird danach in Convex als `MICROLOCATION_FASTAPI_URL` hinterlegt.

## Neue Features ergänzen

1. Neue Datei unter `app/routers/<feature>.py` anlegen.
2. Router in `app/main.py` via `app.include_router(...)` registrieren.
3. Deploy bleibt unverändert: gleiches Vercel-Projekt mit Root `backend`.
