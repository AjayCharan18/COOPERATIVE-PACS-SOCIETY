"""
Create a branch in the database
"""
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import Branch
from sqlalchemy import select


async def create_branch():
    async with AsyncSessionLocal() as db:
        # Check if branch already exists
        result = await db.execute(select(Branch))
        existing = result.scalars().all()
        
        if existing:
            print(f"✅ Found {len(existing)} existing branches:")
            for b in existing:
                print(f"   ID: {b.id}, Name: {b.name}, Code: {b.code}")
            return
        
        # Create branch
        branch = Branch(
            name="Hyderabad Main Branch",
            code="HYD001",
            address="Street No. 1, Hyderabad",
            district="Hyderabad",
            state="Telangana",
            pincode="500001",
            contact_number="9876543210",
            email="hyderabad@dccb.com",
            ifsc_code="DCCB0001001"
        )
        db.add(branch)
        await db.commit()
        await db.refresh(branch)
        
        print(f"✅ Created branch: ID={branch.id}, Name={branch.name}, Code={branch.code}")


if __name__ == "__main__":
    asyncio.run(create_branch())
