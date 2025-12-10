"""Update branches to have only PACS SEETHANAGARAM"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.user import Branch

async def update_branches():
    async with AsyncSessionLocal() as db:
        try:
            # Delete all existing branches
            await db.execute(delete(Branch))
            await db.commit()
            
            print("🗑️ Deleted all existing branches")
            
            # Create PACS SEETHANAGARAM branch
            branch = Branch(
                name="PACS SEETHANAGARAM",
                code="PACS001",
                address="Seethanagaram Village",
                district="Seethanagaram",
                state="Telangana",
                pincode="500001",
                contact_number="9999999999",
                email="adiajay8684@gmail.com",
                ifsc_code="PACS0000001",
                is_active=True
            )
            
            db.add(branch)
            await db.commit()
            
            # Display created branch
            result = await db.execute(select(Branch))
            branches = result.scalars().all()
            
            print("\n✅ Branch updated successfully!\n")
            print("=" * 80)
            for branch in branches:
                print(f"\n🏢 {branch.name}")
                print(f"   Code: {branch.code}")
                print(f"   Village: {branch.address}")
                print(f"   District: {branch.district}")
                print(f"   Contact: {branch.contact_number}")
                print(f"   Email: {branch.email}")
                print(f"   IFSC: {branch.ifsc_code}")
            print("\n" + "=" * 80)
            print(f"\n📊 Total branches: {len(branches)}")
            
        except Exception as e:
            print(f"\n❌ Error updating branches: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(update_branches())
