import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from core.config import settings
from db.session import engine
from models.db import Base

logger = logging.getLogger(__name__)


async def ensure_database_exists() -> None:
    if not settings.DATABASE_URL or "/" not in settings.DATABASE_URL:
        logger.warning("DATABASE_URL is not set or invalid.")
        return
    try:
        base_url, db_name = settings.DATABASE_URL.rsplit("/", 1)
        # Strip query parameters if present (e.g. ?sslmode=require)
        if "?" in db_name:
            db_name = db_name.split("?")[0]
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
    except Exception as e:
        logger.warning("Could not auto-create database (managed cloud DBs usually pre-create databases): %s", e)


async def init_database() -> None:
    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL is not configured.")
        return
    await ensure_database_exists()
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema is ready.")
    except Exception as e:
        logger.error("Database initialization failed: %s", e)

