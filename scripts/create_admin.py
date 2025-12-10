"""
Create an admin user in the database
Run this from the project root: python -c "import sys; sys.path.insert(0, '.'); from scripts.create_admin import create_admin; import asyncio; asyncio.run(create_admin())"
Or simpler: Add admin directly through database or use the seed_data.py script
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def create_admin():
    async with AsyncSessionLocal() as db:
        # Admin details - CHANGE THESE AS NEEDED
        admin_email = "admin@cooperative.com"
        admin_mobile = "8888888888"  # Changed from 9999999999 to avoid duplicate
        admin_password = "admin123"  # Change this password!
        admin_name = "System Administrator"
        branch_id = 1  # Default branch ID

        # Check if admin already exists
        result = await db.execute(select(User).where(User.email == admin_email))
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print(f"\n⚠️  Admin user already exists with email: {admin_email}")
            print(f"   Name: {existing_admin.full_name}")
            print(f"   Role: {existing_admin.role.value}")
            return

        # Create admin user
        admin = User(
            email=admin_email,
            mobile=admin_mobile,
            hashed_password=get_password_hash(admin_password),
            full_name=admin_name,
            role=UserRole.ADMIN,
            is_active=True,
            branch_id=branch_id,
        )

        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        print("\n" + "=" * 80)
        print("✅ ADMIN USER CREATED SUCCESSFULLY")
        print("=" * 80)
        print(f"\nLogin Credentials:")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print(f"Name: {admin_name}")
        print(f"Role: {admin.role.value}")
        print(f"\n⚠️  IMPORTANT: Change the default password after first login!")
        print("=" * 80 + "\n")


if __name__ == "__main__":
    print("\nCreating admin user...")
    print("You can edit this script to change admin details before running.\n")
    asyncio.run(create_admin())
