"""
Add farmer_id column to users table
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import AsyncSessionLocal


async def add_farmer_id_column():
    """Add farmer_id column to users table"""
    async with AsyncSessionLocal() as db:
        try:
            # Add column if it doesn't exist
            await db.execute(
                text(
                    """
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS farmer_id VARCHAR(20) UNIQUE
            """
                )
            )

            # Create index
            await db.execute(
                text(
                    """
                CREATE UNIQUE INDEX IF NOT EXISTS ix_users_farmer_id 
                ON users (farmer_id)
            """
                )
            )

            await db.commit()
            print("✅ farmer_id column added successfully!")

        except Exception as e:
            await db.rollback()
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("Adding farmer_id column to users table...")
    asyncio.run(add_farmer_id_column())
