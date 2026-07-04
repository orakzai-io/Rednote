import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from db.session import SessionLocal
from models.db import User, Document, Chunk

async def main():
    async with SessionLocal() as session:
        # Get users
        res_users = await session.execute(select(User))
        users = res_users.scalars().all()
        print(f"Users count: {len(users)}")
        for u in users:
            print(f"User ID: {u.id}, Email: {u.email}")
            
        # Get documents
        res_docs = await session.execute(select(Document))
        docs = res_docs.scalars().all()
        print(f"Documents count: {len(docs)}")
        for d in docs:
            print(f"Doc ID: {d.id}, Filename: {d.filename}, Hash: {d.content_hash}")
            
        # Get first few chunks
        res_chunks = await session.execute(select(Chunk).limit(10))
        chunks = res_chunks.scalars().all()
        print(f"Chunks count: {len(chunks)}")
        for c in chunks:
            print(f"Chunk index: {c.chunk_index}, Content preview: {c.content[:200]}")

if __name__ == "__main__":
    asyncio.run(main())
