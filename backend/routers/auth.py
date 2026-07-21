from fastapi import APIRouter, Depends, Header, HTTPException, status
from uuid import UUID
from typing import Any, cast
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_async_session
from models.db import User, Document
from schemas.schemas import UserCreate, UserRead, UserUpdate
from core.security import auth_backend, current_active_user, fastapi_users, get_user_manager, UserManager


router = APIRouter()

router.include_router(
    fastapi_users.get_auth_router(auth_backend),  # type: ignore[arg-type]
    prefix="/auth/jwt",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

@router.delete("/auth/me", status_code=204, tags=["auth"])
async def delete_my_account(
    user: User = Depends(current_active_user),
    user_manager: UserManager = Depends(get_user_manager), 
):
    await user_manager.delete(user)
    return None


@router.post("/auth/claim-guest-docs", status_code=200, tags=["auth"])
async def claim_guest_docs(
    current_user: User = Depends(current_active_user),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID"),
    db: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),  # type: ignore[arg-type]
):
    if not x_guest_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Guest-ID header is required to claim guest documents."
        )
    
    try:
        guest_uuid = UUID(x_guest_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-Guest-ID header format. Must be a valid UUID."
        )

    # 1. Update documents to belong to the new registered user
    stmt = (
        update(Document)
        .where(Document.user_id == guest_uuid)
        .values(user_id=current_user.id)
    )
    await db.execute(stmt)
    await db.commit()

    # 2. Clean up temporary guest user record from the users table
    guest_stmt = select(User).where(cast(Any, User.id) == guest_uuid)
    result = await db.execute(guest_stmt)
    guest_user = result.scalars().first()
    
    if guest_user:
        try:
            await user_manager.delete(guest_user)
        except Exception as e:
            # Non-blocking log
            print(f"Failed to delete guest user {guest_uuid} after claim: {e}")

    return {"status": "success", "detail": "Documents claimed successfully."}