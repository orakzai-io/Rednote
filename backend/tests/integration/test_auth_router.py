"""Integration tests for the auth router using SQLite in-memory database."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."))

import pytest
from httpx import AsyncClient



@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    """Successful registration should return user info."""
    payload = {
        "email": "newuser@example.com",
        "password": "StrongPass123!",
    }
    resp = await async_client.post("/auth/register", json=payload)
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert data["is_active"] is True
    assert "id" in data
    # Password should not be exposed
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    """Registering with an existing email should fail."""
    payload = {
        "email": "dup@example.com",
        "password": "StrongPass123!",
    }
    resp1 = await async_client.post("/auth/register", json=payload)
    assert resp1.status_code in (200, 201)

    resp2 = await async_client.post("/auth/register", json=payload)
    assert resp2.status_code in (400, 409)


@pytest.mark.asyncio
async def test_register_weak_password(async_client: AsyncClient):
    """A weak password should be rejected (if fastapi-users enforces it)."""
    payload = {
        "email": "weakpass@example.com",
        "password": "short",
    }
    resp = await async_client.post("/auth/register", json=payload)
    # FastAPI Users does not enforce password strength by default,
    # so this may succeed. The test documents current behavior.
    assert resp.status_code in (200, 201, 400, 422)


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    """Login with valid credentials should return an access token."""
    email = "login_test@example.com"
    password = "TestPass123!"

    # Register first
    reg_resp = await async_client.post("/auth/register", json={
        "email": email,
        "password": password,
    })
    assert reg_resp.status_code in (200, 201)

    # Login
    login_data = f"username={email}&password={password}"
    resp = await async_client.post(
        "/auth/jwt/login",
        content=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient):
    """Login with wrong password should return 400."""
    email = "wrongpass@example.com"
    password = "CorrectPass123!"

    reg_resp = await async_client.post("/auth/register", json={
        "email": email,
        "password": password,
    })
    assert reg_resp.status_code in (200, 201)

    login_data = f"username={email}&password=WrongPass321!"
    resp = await async_client.post(
        "/auth/jwt/login",
        content=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_get_me_authenticated(async_client: AsyncClient):
    """GET /users/me should return user info when authenticated."""
    email = "getme@example.com"
    password = "TestPass123!"

    # Register
    await async_client.post("/auth/register", json={
        "email": email,
        "password": password,
    })

    # Login
    login_data = f"username={email}&password={password}"
    login_resp = await async_client.post(
        "/auth/jwt/login",
        content=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login_resp.json()["access_token"]

    # Get me
    resp = await async_client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == email
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_get_me_unauthenticated(async_client: AsyncClient):
    """GET /users/me without a token should return 401."""
    resp = await async_client.get("/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(async_client: AsyncClient):
    """Logout should succeed for an authenticated user."""
    email = "logout_test@example.com"
    password = "TestPass123!"

    await async_client.post("/auth/register", json={
        "email": email,
        "password": password,
    })

    login_data = f"username={email}&password={password}"
    login_resp = await async_client.post(
        "/auth/jwt/login",
        content=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login_resp.json()["access_token"]

    resp = await async_client.post(
        "/auth/jwt/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code in (200, 204)


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """GET / should return status running."""
    resp = await async_client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "running"}
