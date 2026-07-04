import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from core.config import settings
from db.session import engine
from models.db import Base

logger = logging.getLogger(__name__)


async def ensure_database_exists() -> None:
    base_url, db_name = settings.DATABASE_URL.rsplit("/", 1)
    admin_engine = create_async_engine(
        f"{base_url}/postgres",
        isolation_level="AUTOCOMMIT",
    )
    try:
        async with admin_engine.connect() as conn:
            exists = await conn.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": db_name},
            )
            if not exists:
                await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info("Created database '%s'.", db_name)
    finally:
        await admin_engine.dispose()


async def init_database() -> None:
    await ensure_database_exists()
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema is ready.")
