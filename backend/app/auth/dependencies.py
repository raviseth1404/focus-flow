import jwt
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer()

JWKS_TTL = timedelta(hours=1)

# Cache JWKS public keys with a timestamp for TTL invalidation
_jwks_cache: dict = {}
_jwks_fetched_at: Optional[datetime] = None


async def _get_jwks() -> dict:
    """Fetch and cache Supabase JWKS public keys. Refreshes every hour."""
    global _jwks_cache, _jwks_fetched_at
    now = datetime.now(timezone.utc)
    if _jwks_cache and _jwks_fetched_at and (now - _jwks_fetched_at) < JWKS_TTL:
        return _jwks_cache
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        data = resp.json()
        _jwks_cache = {key["kid"]: key for key in data["keys"]}
        _jwks_fetched_at = now
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verifies the Supabase JWT (ES256 or HS256) from the Authorization header.
    Returns decoded payload (sub = user UUID, email, role, etc.).
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials

    # Decode header to find algorithm and key id
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header")

    alg = header.get("alg", "HS256")

    try:
        if alg == "ES256":
            # Fetch JWKS and find matching public key
            kid = header.get("kid")
            jwks = await _get_jwks()
            if kid not in jwks:
                # Bust cache and retry once (handles key rotation)
                global _jwks_fetched_at
                _jwks_cache.clear()
                _jwks_fetched_at = None
                jwks = await _get_jwks()
            if kid not in jwks:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown key ID")

            jwk = jwks[kid]
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(jwk)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Legacy HS256 — use raw JWT secret
            import base64
            secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
            )

        if not payload.get("sub"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing subject")
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")


def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """Convenience dependency — returns just the user UUID string."""
    return current_user["sub"]
