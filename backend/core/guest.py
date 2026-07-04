from uuid import UUID
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_async_session
from models.db import User
from core.security import fastapi_users

# Use fastapi_users to optionally fetch current logged in user
optional_current_user = fastapi_users.current_user(active=True, optional=True)

async def get_current_user_or_guest(
    current_user: User | None = Depends(optional_current_user),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID"),
    db: AsyncSession = Depends(get_async_session),
) -> User:
    """
    Dependency that resolves the request identity.
    If authenticated via JWT, returns the logged in User.
    Otherwise, expects an X-Guest-ID header, validates it,
    and returns (or creates) a temporary guest User record in the database.
    """
    if current_user:
        return current_user

    if not x_guest_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required or X-Guest-ID header missing."
        )

    try:
        guest_uuid = UUID(x_guest_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-Guest-ID header format. Must be a valid UUID."
        )

    # Lookup guest user in database
    stmt = select(User).where(User.id == guest_uuid)
    result = await db.execute(stmt)
    guest_user = result.scalars().first()

    if not guest_user:
        # Create a new inactive/guest User row
        guest_user = User(
            id=guest_uuid,
            email=f"guest_{guest_uuid}@guest.rednote",
            hashed_password="!",  # invalid hash to prevent standard login
            is_active=True,
            is_verified=True,
            is_superuser=False,
        )
        db.add(guest_user)
        try:
            await db.commit()
            await db.refresh(guest_user)
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not initialize guest session: {str(e)}"
            )

    return guest_user
