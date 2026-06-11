import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock


FAKE_JWT_PAYLOAD = {
    "sub": "00000000-0000-0000-0000-000000000001",
    "email": "test@focusflow.app",
    "role": "authenticated",
    "aud": "authenticated",
}


@pytest.fixture
def mock_auth():
    """Patch JWT verification to return a fake user."""
    with patch("app.auth.dependencies.jwt.decode", return_value=FAKE_JWT_PAYLOAD):
        yield FAKE_JWT_PAYLOAD


@pytest_asyncio.fixture
async def client(mock_auth):
    from app.main import app
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
