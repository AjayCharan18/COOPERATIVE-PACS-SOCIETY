"""Create all database tables in Supabase"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
from app.models import *


async def create_tables():
    async with engine.begin() as conn:
        print("🔧 Creating all database tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ All tables created successfully!")

        # Check if loan_type_configs table exists and has data
        result = await conn.execute(text("SELECT COUNT(*) FROM loan_type_configs"))
        count = result.scalar()
        print(f"📊 Found {count} loan type configurations")


if __name__ == "__main__":
    asyncio.run(create_tables())
