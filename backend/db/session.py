from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings

db_url = settings.DATABASE_URL if settings.DATABASE_URL else "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    db_url,
    echo=False,  # Disable SQL echo in production
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
