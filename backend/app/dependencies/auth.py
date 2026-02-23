from typing import Optional

from fastapi import Header, HTTPException

from app.config import settings


def require_service_token(authorization: Optional[str] = Header(default=None)) -> None:
    expected = settings.service_token.strip()
    if not expected:
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.replace("Bearer ", "").strip()
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid bearer token")

