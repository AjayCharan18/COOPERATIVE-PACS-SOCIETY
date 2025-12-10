"""
Check users in PostgreSQL database
"""

import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def check_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()

        print("\n" + "=" * 80)
        print("USERS IN POSTGRESQL DATABASE")
        print("=" * 80)

        if not users:
            print("\n⚠️  No users found in database!")
            print("Run: python scripts/seed_data.py to create default users")
        else:
            for user in users:
                print(f"\nID: {user.id}")
                print(f"Email: {user.email}")
                print(f"Mobile: {user.mobile}")
                print(f"Name: {user.full_name}")
                print(f"Role: {user.role.value}")
                print(f"Active: {user.is_active}")
                print(f"Branch ID: {user.branch_id}")
                print("-" * 80)

        print(f"\nTotal users: {len(users)}")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(check_users())
