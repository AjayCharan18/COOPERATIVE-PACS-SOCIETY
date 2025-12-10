"""Check branches in database"""

import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import Branch


async def check_branches():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Branch))
        branches = result.scalars().all()

        print(f"\n{'='*60}")
        print(f"BRANCHES IN DATABASE")
        print(f"{'='*60}")
        print(f"Total: {len(branches)}\n")

        if not branches:
            print("⚠️  No branches found!")
            print("Run: python scripts/seed_data.py")
        else:
            for branch in branches:
                print(f"ID: {branch.id}")
                print(f"Name: {branch.name}")
                print(f"Code: {branch.code}")
                print(f"Address: {branch.address}")
                print(f"-" * 60)


if __name__ == "__main__":
    asyncio.run(check_branches())
