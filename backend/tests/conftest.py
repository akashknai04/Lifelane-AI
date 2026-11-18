import pytest_asyncio
from backend.app.db.session import init_db

@pytest_asyncio.fixture(autouse=True)
async def ensure_db_tables():
    await init_db()
    yield
