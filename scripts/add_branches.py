"""
Script to add initial branches
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.user import Branch
from app.core.config import settings


async def add_branches():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        branches = [
            Branch(
                id=1,
                name='Main Branch',
                code='MB001',
                address='Main Road, Hyderabad',
                district='Hyderabad',
                state='Telangana',
                is_active=True
            ),
            Branch(
                id=3,
                name='Warangal Branch',
                code='WGL001',
                address='Station Road, Warangal',
                district='Warangal',
                state='Telangana',
                is_active=True
            ),
            Branch(
                id=4,
                name='Karimnagar Branch',
                code='KMR001',
                address='Market Street, Karimnagar',
                district='Karimnagar',
                state='Telangana',
                is_active=True
            )
        ]
        
        session.add_all(branches)
        await session.commit()
        print("✅ Branches created successfully")
        print(f"   ID: 1, Name: Main Branch, Code: MB001")
        print(f"   ID: 3, Name: Warangal Branch, Code: WGL001")
        print(f"   ID: 4, Name: Karimnagar Branch, Code: KMR001")


if __name__ == "__main__":
    asyncio.run(add_branches())
