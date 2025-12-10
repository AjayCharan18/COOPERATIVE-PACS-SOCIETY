"""Update branch name to PACS SEETHANAGARAM"""

import asyncio
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import Branch


async def update_branch_name():
    async with AsyncSessionLocal() as db:
        try:
            print("\n" + "=" * 80)
            print("UPDATING BRANCH NAME TO PACS SEETHANAGARAM")
            print("=" * 80)

            # Get branch with ID 1
            result = await db.execute(select(Branch).where(Branch.id == 1))
            branch = result.scalar_one_or_none()

            if not branch:
                print("❌ Branch ID 1 not found")
                return

            print(f"\nCurrent branch name: {branch.name}")
            print(f"Current branch code: {branch.code}")
            print(f"Current address: {branch.address}")

            # Update branch details
            branch.name = "PACS SEETHANAGARAM"
            branch.code = "PACS001"
            branch.address = "Seethanagaram Village"
            branch.district = "ELURU"

            await db.commit()
            await db.refresh(branch)

            print(f"\n✅ Branch updated successfully!")
            print(f"New name: {branch.name}")
            print(f"New code: {branch.code}")
            print(f"New address: {branch.address}")
            print("=" * 80 + "\n")

        except Exception as e:
            import traceback

            print("\n" + "=" * 80)
            print("❌ ERROR:")
            print(traceback.format_exc())
            print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(update_branch_name())
