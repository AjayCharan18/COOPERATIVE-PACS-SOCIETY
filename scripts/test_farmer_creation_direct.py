"""Direct test of farmer creation logic"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime
import secrets

async def test_farmer_creation():
    async with AsyncSessionLocal() as db:
        try:
            print("\n" + "="*80)
            print("TESTING FARMER CREATION")
            print("="*80)
            
            # Test data
            farmer_data = {
                "email": "newfarmer123@test.com",
                "full_name": "Test New Farmer",
                "mobile": "9876543210",
                "branch_id": 1,
                "district": "Hyderabad",
                "state": "Telangana",
                "aadhaar_number": "999988887777",
                "village": "Test Village",
                "land_area": "5.5",
                "crop_type": "Cotton",
                "send_credentials_via": "email"
            }
            
            print(f"\nTest Data: {farmer_data}")
            
            # Check if user already exists
            result = await db.execute(
                select(User).where(
                    or_(
                        User.email == farmer_data.get("email"),
                        User.mobile == farmer_data.get("mobile")
                    )
                )
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"\n❌ User already exists: {existing_user.email}")
                # Delete for testing
                print("Deleting existing user for test...")
                await db.delete(existing_user)
                await db.commit()
                print("✅ Deleted")
            
            # Check if aadhaar already exists
            if farmer_data.get("aadhaar_number"):
                result = await db.execute(
                    select(User).where(User.aadhaar_number == farmer_data.get("aadhaar_number"))
                )
                existing_aadhaar = result.scalar_one_or_none()
                if existing_aadhaar:
                    print(f"\n❌ Aadhaar already exists for user: {existing_aadhaar.email}")
                    print("Clearing aadhaar for test...")
                    existing_aadhaar.aadhaar_number = None
                    await db.commit()
                    print("✅ Cleared")
            
            # Generate farmer_id
            farmer_count_result = await db.execute(
                select(User).where(User.role == 'farmer')
            )
            farmer_count = len(farmer_count_result.scalars().all())
            farmer_id = f"FMR{farmer_count + 1:04d}"
            print(f"\nGenerated farmer_id: {farmer_id}")
            
            # Generate temp password
            temp_password = secrets.token_urlsafe(12)[:12]
            print(f"Generated password: {temp_password}")
            
            # Helper function
            def get_or_none(value):
                return value if value and value.strip() else None
            
            # Create farmer
            print("\nCreating farmer user...")
            new_farmer = User(
                farmer_id=farmer_id,
                email=farmer_data.get("email"),
                mobile=farmer_data.get("mobile"),
                hashed_password=get_password_hash(temp_password),
                full_name=farmer_data.get("full_name"),
                role=UserRole.FARMER,
                is_active=True,
                is_verified=True,
                aadhaar_number=get_or_none(farmer_data.get("aadhaar_number")),
                village=get_or_none(farmer_data.get("village")),
                mandal=get_or_none(farmer_data.get("mandal")),
                district=get_or_none(farmer_data.get("district")),
                state=get_or_none(farmer_data.get("state")),
                land_area=get_or_none(farmer_data.get("land_area")),
                crop_type=get_or_none(farmer_data.get("crop_type")),
                branch_id=farmer_data.get("branch_id"),
                created_at=datetime.utcnow()
            )
            
            print(f"Farmer object created: {new_farmer.email}")
            print(f"  - farmer_id: {new_farmer.farmer_id}")
            print(f"  - role: {new_farmer.role}")
            print(f"  - aadhaar: {new_farmer.aadhaar_number}")
            print(f"  - branch_id: {new_farmer.branch_id}")
            
            db.add(new_farmer)
            await db.commit()
            await db.refresh(new_farmer)
            
            print("\n✅ SUCCESS! Farmer created successfully!")
            print(f"   ID: {new_farmer.id}")
            print(f"   Farmer ID: {new_farmer.farmer_id}")
            print(f"   Email: {new_farmer.email}")
            print(f"   Name: {new_farmer.full_name}")
            print("="*80 + "\n")
            
        except Exception as e:
            import traceback
            print("\n" + "="*80)
            print("❌ ERROR:")
            print(traceback.format_exc())
            print("="*80 + "\n")

if __name__ == "__main__":
    asyncio.run(test_farmer_creation())
