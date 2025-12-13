"""
Database session management
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Create async engine
_engine_kwargs = {
    "echo": settings.ENVIRONMENT == "development",
    "future": True,
    "pool_pre_ping": True,
    "connect_args": {"statement_cache_size": 0},
}

# When running behind PgBouncer in transaction/statement pooling mode (common on Render),
# connection-level state like prepared statements is not reliable. NullPool avoids
# reusing DB connections across requests.
if settings.ENVIRONMENT != "development":
    # Supabase (and many hosted Postgres providers) require SSL.
    # asyncpg expects an SSL context or True/False, not a string like "require".
    _engine_kwargs["connect_args"]["ssl"] = True
    _engine_kwargs["poolclass"] = NullPool
else:
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """Dependency for getting async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
