"""Create test users in Supabase database"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


async def create_users():
    async with AsyncSessionLocal() as db:
        try:
            # Check if users already exist
            result = await db.execute(select(User))
            existing = result.scalars().all()

            if existing:
                print(f"⚠️ Found {len(existing)} existing users:")
                for user in existing:
                    print(f"   - {user.email} ({user.role.value})")
                return

            print("🔧 Creating test users...")

            users = [
                {
                    "email": "admin@dccb.com",
                    "mobile": "9999999999",
                    "hashed_password": get_password_hash("admin123"),
                    "full_name": "Admin User",
                    "role": UserRole.ADMIN,
                    "is_active": True,
                    "is_verified": True,
                    "farmer_id": None,
                    "branch_id": None,
                },
                {
                    "email": "employee@dccb.com",
                    "mobile": "9999999998",
                    "hashed_password": get_password_hash("employee123"),
                    "full_name": "Employee User",
                    "role": UserRole.EMPLOYEE,
                    "is_active": True,
                    "is_verified": True,
                    "farmer_id": None,
                    "branch_id": None,
                },
                {
                    "email": "farmer@dccb.com",
                    "mobile": "9999999997",
                    "hashed_password": get_password_hash("farmer123"),
                    "full_name": "Farmer User",
                    "role": UserRole.FARMER,
                    "is_active": True,
                    "is_verified": True,
                    "farmer_id": "FARMER001",
                    "branch_id": None,
                    "aadhaar_number": "123456789012",
                    "village": "Test Village",
                    "mandal": "Test Mandal",
                    "district": "Test District",
                    "state": "Telangana",
                    "pincode": "500001",
                },
            ]

            # Add users to database
            for user_data in users:
                user = User(**user_data)
                db.add(user)

            await db.commit()

            # Display created users
            result = await db.execute(select(User))
            users = result.scalars().all()

            print("\n✅ Users created successfully!\n")
            print("=" * 80)
            print("\n🔐 Login Credentials:\n")

            print("👤 Admin:")
            print("   Email: admin@dccb.com")
            print("   Password: admin123")
            print("   Mobile: 9999999999")

            print("\n👤 Employee:")
            print("   Email: employee@dccb.com")
            print("   Password: employee123")
            print("   Mobile: 9999999998")

            print("\n👤 Farmer:")
            print("   Email: farmer@dccb.com")
            print("   Password: farmer123")
            print("   Mobile: 9999999997")
            print("   Farmer ID: FARMER001")

            print("\n" + "=" * 80)
            print(f"\n📊 Total users: {len(users)}")

        except Exception as e:
            print(f"\n❌ Error creating users: {e}")
            import traceback

            traceback.print_exc()
            await db.rollback()


if __name__ == "__main__":
    asyncio.run(create_users())
