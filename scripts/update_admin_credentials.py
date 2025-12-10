"""
Update admin user credentials
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select


async def update_admin_credentials():
    """Update admin user email and password"""
    async with AsyncSessionLocal() as db:
        try:
            new_email = "adiajay12367@gmail.com"
            new_password = "Ajay12367@"

            # Check if email already exists
            result = await db.execute(select(User).where(User.email == new_email))
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(
                    f"Email {new_email} already exists for user ID: {existing_user.id}, Role: {existing_user.role}"
                )
                print("Deleting existing user...")
                await db.delete(existing_user)
                await db.commit()
                print("Existing user deleted")

            # Find admin user
            result = await db.execute(select(User).where(User.role == "admin"))
            admin = result.scalar_one_or_none()

            if not admin:
                print("Admin user not found!")
                return

            print(f"Found admin user: {admin.email} (ID: {admin.id})")

            # Update credentials
            admin.email = new_email
            admin.hashed_password = get_password_hash(new_password)

            await db.commit()

            print("Admin credentials updated successfully!")
            print(f"   New Email: {new_email}")
            print(f"   New Password: {new_password}")

        except Exception as e:
            print(f"Error updating admin credentials: {e}")
            await db.rollback()


if __name__ == "__main__":
    asyncio.run(update_admin_credentials())
