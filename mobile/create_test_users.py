"""
Create test users for mobile app testing
"""
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_test_users():
    async with AsyncSessionLocal() as db:
        # Check if farmer1 exists
        result = await db.execute(
            select(User).where(User.email == "farmer1@test.com")
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"✓ User farmer1@test.com already exists")
            print(f"  Name: {existing_user.full_name}")
            print(f"  Role: {existing_user.role}")
        else:
            # Create farmer1
            farmer = User(
                email="farmer1@test.com",
                hashed_password=get_password_hash("test123"),
                full_name="Test Farmer",
                role="farmer",
                is_active=True,
                mobile="9876543210"
            )
            db.add(farmer)
            await db.commit()
            print(f"✓ Created user: farmer1@test.com")
            print(f"  Password: test123")
            print(f"  Role: farmer")
        
        # List all users
        result = await db.execute(select(User))
        all_users = result.scalars().all()
        
        print(f"\n📊 Total users in database: {len(all_users)}")
        for user in all_users:
            print(f"  - {user.email} ({user.role}) - {user.full_name}")

if __name__ == "__main__":
    asyncio.run(create_test_users())
