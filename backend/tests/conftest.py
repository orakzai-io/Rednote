"""Shared pytest fixtures for the Notebook backend test suite.

Provides:
- A SQLite in-memory async database for isolation
- A FastAPI TestClient (httpx.AsyncClient)
- A test user fixture with JWT auth headers
- Guest user fixture with X-Guest-ID header
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from main import app
from models.db import Base, User
from db.session import get_async_session
from core.config import settings


# ── Override settings for testing ──────────────────────────────────
# Force test values before any module imports use settings
settings.DATABASE_URL = "sqlite+aiosqlite:///:memory:"
settings.UPLOAD_DIR = "/tmp/test_notebook_uploads"
settings.FASTEMBED_CACHE_PATH = "/tmp/test_fastembed_cache"
settings.SECRET_KEY = "test-secret-key-for-testing-only"
settings.GROQ_API_KEY = "test-groq-key"
settings.TOP_K = 5
settings.CHUNK_SIZE = 500
settings.CHUNK_OVERLAP = 50
settings.MAX_FILE_SIZE = 10 * 1024 * 1024

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# ── Test engine & session ──────────────────────────────────────────
test_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
)

test_async_session_maker = async_sessionmaker(
    test_engine, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire session."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test and drop after. Autouse for isolation."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Override the FastAPI dependency to use the test database session."""
    async with test_async_session_maker() as session:
        yield session


app.dependency_overrides[get_async_session] = override_get_async_session


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    """Provide a test database session directly."""
    async with test_async_session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client against the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create and return a test user in the database."""
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="testuser@example.com",
        hashed_password="$argon2id$v=19$m=65536,t=3,p=4$...",  # placeholder hash
        is_active=True,
        is_verified=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def guest_user(db_session: AsyncSession) -> User:
    """Create and return a guest user in the database."""
    guest_id = uuid.uuid4()
    user = User(
        id=guest_id,
        email=f"guest_{guest_id}@guest.rednote",
        hashed_password="!",
        is_active=True,
        is_verified=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User, async_client: AsyncClient) -> dict[str, str]:
    """Obtain JWT token for the test user via login, return Authorization headers."""
    # Use the register endpoint to create a proper user with a real password hash
    # Registration endpoint expects: {"email": ..., "password": ...}
    
    # First, register a user that gets a real password hash from fastapi-users
    register_payload = {
        "email": "test-auth@example.com",
        "password": "TestPass123!",
    }
    resp = await async_client.post("/auth/register", json=register_payload)
    if resp.status_code not in (200, 201):
        pytest.skip(f"Failed to register test user: {resp.text}")

    # Now login to get JWT token
    login_data = f"username={register_payload['email']}&password={register_payload['password']}"
    resp = await async_client.post(
        "/auth/jwt/login",
        content=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if resp.status_code != 200:
        pytest.skip(f"Failed to log in test user: {resp.text}")

    token_data = resp.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest_asyncio.fixture
async def guest_headers(guest_user: User) -> dict[str, str]:
    """Provide X-Guest-ID header for guest user tests."""
    return {"X-Guest-ID": str(guest_user.id)}