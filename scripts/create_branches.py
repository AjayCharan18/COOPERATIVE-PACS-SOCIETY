"""Create test branches in Supabase database"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.branch import Branch

async def create_branches():
    async with AsyncSessionLocal() as db:
        try:
            # Check if branches already exist
            result = await db.execute(select(Branch))
            existing = result.scalars().all()
            
            if existing:
                print(f"⚠️ Found {len(existing)} existing branches:")
                for branch in existing:
                    print(f"   - {branch.name} ({branch.code})")
                return
            
            print("🔧 Creating test branches...")
            
            branches = [
                {
                    "name": "Main Branch Hyderabad",
                    "code": "HYD001",
                    "address": "Tank Bund Road, Hyderabad",
                    "district": "Hyderabad",
                    "state": "Telangana",
                    "pincode": "500001",
                    "contact_number": "040-12345678",
                    "email": "hyderabad@dccb.com",
                    "ifsc_code": "DCCB0001001",
                    "is_active": True
                },
                {
                    "name": "Warangal Branch",
                    "code": "WGL001",
                    "address": "Main Road, Warangal",
                    "district": "Warangal",
                    "state": "Telangana",
                    "pincode": "506001",
                    "contact_number": "0870-1234567",
                    "email": "warangal@dccb.com",
                    "ifsc_code": "DCCB0001002",
                    "is_active": True
                },
                {
                    "name": "Karimnagar Branch",
                    "code": "KMR001",
                    "address": "Station Road, Karimnagar",
                    "district": "Karimnagar",
                    "state": "Telangana",
                    "pincode": "505001",
                    "contact_number": "0878-1234567",
                    "email": "karimnagar@dccb.com",
                    "ifsc_code": "DCCB0001003",
                    "is_active": True
                },
                {
                    "name": "Nizamabad Branch",
                    "code": "NZB001",
                    "address": "Market Road, Nizamabad",
                    "district": "Nizamabad",
                    "state": "Telangana",
                    "pincode": "503001",
                    "contact_number": "08462-123456",
                    "email": "nizamabad@dccb.com",
                    "ifsc_code": "DCCB0001004",
                    "is_active": True
                },
                {
                    "name": "Khammam Branch",
                    "code": "KHM001",
                    "address": "Wyra Road, Khammam",
                    "district": "Khammam",
                    "state": "Telangana",
                    "pincode": "507001",
                    "contact_number": "08742-123456",
                    "email": "khammam@dccb.com",
                    "ifsc_code": "DCCB0001005",
                    "is_active": True
                }
            ]
            
            # Add branches to database
            for branch_data in branches:
                branch = Branch(**branch_data)
                db.add(branch)
            
            await db.commit()
            
            # Display created branches
            result = await db.execute(select(Branch))
            branches = result.scalars().all()
            
            print("\n✅ Branches created successfully!\n")
            print("=" * 80)
            for branch in branches:
                print(f"\n🏢 {branch.name}")
                print(f"   Code: {branch.code}")
                print(f"   District: {branch.district}")
                print(f"   Contact: {branch.contact_number}")
                print(f"   Email: {branch.email}")
                print(f"   IFSC: {branch.ifsc_code}")
            print("\n" + "=" * 80)
            print(f"\n📊 Total branches: {len(branches)}")
            
        except Exception as e:
            print(f"\n❌ Error creating branches: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(create_branches())
