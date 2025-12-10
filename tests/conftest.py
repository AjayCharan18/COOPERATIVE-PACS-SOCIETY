"""
Pytest configuration and fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient

from app.main import app
from app.db.base import Base
from app.core.config import settings
from app.db.session import get_db

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost/dccb_loan_test"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client"""
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Create test user"""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    user = User(
        email="test@example.com",
        mobile="9999999999",
        hashed_password=get_password_hash("Test@123"),
        full_name="Test User",
        role=UserRole.FARMER,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
async def test_employee(test_db: AsyncSession):
    """Create test employee"""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    employee = User(
        email="employee@example.com",
        mobile="8888888888",
        hashed_password=get_password_hash("Employee@123"),
        full_name="Test Employee",
        role=UserRole.EMPLOYEE,
        is_active=True
    )
    test_db.add(employee)
    await test_db.commit()
    await test_db.refresh(employee)
    return employee


@pytest.fixture
async def test_admin(test_db: AsyncSession):
    """Create test admin"""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    admin = User(
        email="admin@example.com",
        mobile="7777777777",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Test Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    test_db.add(admin)
    await test_db.commit()
    await test_db.refresh(admin)
    return admin


@pytest.fixture
async def test_branch(test_db: AsyncSession):
    """Create test branch"""
    from app.models.user import Branch
    
    branch = Branch(
        branch_code="TEST001",
        branch_name="Test Branch",
        address="Test Address",
        city="Test City",
        state="Test State",
        pincode="500001",
        contact_number="0401234567",
        is_active=True
    )
    test_db.add(branch)
    await test_db.commit()
    await test_db.refresh(branch)
    return branch


@pytest.fixture
async def auth_headers(client: AsyncClient, test_user):
    """Get authentication headers for test user"""
    from app.services.auth_service import AuthService
    
    token = AuthService.create_access_token(
        user_id=test_user.id,
        email=test_user.email,
        role=test_user.role
    )
    return {"Authorization": f"Bearer {token}"}
