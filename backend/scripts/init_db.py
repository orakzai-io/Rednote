"""Manual database setup (also runs automatically on app startup)."""
import asyncio

from db.init import init_database


async def main() -> None:
    await init_database()
    print("Database schema is ready.")


if __name__ == "__main__":
    asyncio.run(main())
