import httpx
from app.config import settings

SUPABASE_STORAGE_URL = f"{settings.SUPABASE_URL}/storage/v1"
BUCKET = "attachments"


async def create_signed_upload_url(storage_path: str) -> str:
    """Generate a presigned upload URL via Supabase Storage API."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_STORAGE_URL}/object/upload/sign/{BUCKET}/{storage_path}",
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            },
            json={"expiresIn": 3600},
        )
        resp.raise_for_status()
        data = resp.json()
        return f"{settings.SUPABASE_URL}/storage/v1{data['url']}"


async def create_signed_download_url(storage_path: str, expires_in: int = 3600) -> str:
    """Generate a presigned download URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_STORAGE_URL}/object/sign/{BUCKET}/{storage_path}",
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            },
            json={"expiresIn": expires_in},
        )
        resp.raise_for_status()
        data = resp.json()
        return f"{settings.SUPABASE_URL}/storage/v1{data['signedURL']}"


async def delete_file(storage_path: str) -> None:
    """Delete a file from Supabase Storage."""
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{SUPABASE_STORAGE_URL}/object/{BUCKET}/{storage_path}",
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            },
        )
        resp.raise_for_status()
