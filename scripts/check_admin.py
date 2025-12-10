"""Check admin credentials"""

import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from sqlalchemy import select


async def check_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        admin = result.scalar_one_or_none()
        if admin:
            print(f"Email: {admin.email}")
            print(f"Name: {admin.full_name}")
        else:
            print("No admin found")


if __name__ == "__main__":
    asyncio.run(check_admin())
