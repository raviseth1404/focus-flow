from fastapi import APIRouter, Request
import jwt, base64
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@router.post("/debug-jwt")
async def debug_jwt(request: Request):
    """Temporary endpoint to debug JWT decoding."""
    body = await request.json()
    token = body.get("token", "")
    try:
        secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)
        payload = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
        return {"status": "ok", "sub": payload.get("sub"), "email": payload.get("email")}
    except Exception as e:
        # Try without base64 decode
        try:
            payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            return {"status": "ok_raw", "sub": payload.get("sub"), "note": "raw secret works"}
        except Exception as e2:
            return {"status": "error", "b64_error": str(e), "raw_error": str(e2)}
