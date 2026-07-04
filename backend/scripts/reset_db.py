import asyncio
import logging
import sys

# Add backend to path if needed
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import engine
from db.init import init_database
from models.db import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reset_database() -> None:
    logger.info("Dropping all existing database tables...")
    async with engine.begin() as conn:
        # Disable foreign key checks or cascade drops if needed, drop_all handles order/cascade automatically
        await conn.run_sync(Base.metadata.drop_all)
    logger.info("Tables dropped successfully. Re-initializing database...")
    await init_database()
    logger.info("Database reset and schema creation complete!")

if __name__ == "__main__":
    asyncio.run(reset_database())
