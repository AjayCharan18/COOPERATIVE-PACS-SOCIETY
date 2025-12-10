"""
Update admin mobile number to None
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def update_admin_mobile():
    """Update admin user mobile to None"""
    async with AsyncSessionLocal() as db:
        try:
            # Find admin user
            result = await db.execute(
                select(User).where(User.email == "adiajay12367@gmail.com")
            )
            admin = result.scalar_one_or_none()
            
            if not admin:
                print("Admin user not found!")
                return
            
            print(f"Found admin user: {admin.email}")
            print(f"Current mobile: {admin.mobile}")
            
            # Update mobile to empty string (column has NOT NULL constraint)
            admin.mobile = ""
            
            await db.commit()
            
            print("Admin mobile number removed successfully!")
            
        except Exception as e:
            print(f"Error updating admin mobile: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(update_admin_mobile())
