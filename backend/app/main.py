from fastapi import FastAPI

from app.config import settings
from app.routers.microlocation import router as microlocation_router

app = FastAPI(title="immocal-backend", version="1.0.0")
app.include_router(microlocation_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name, "env": settings.app_env}
