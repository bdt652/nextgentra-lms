"""Pytest configuration and fixtures for integration tests."""

from pathlib import Path
import sys

from fastapi.testclient import TestClient
import pytest

from prisma import Prisma

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


# Track if database has been seeded in this session
_database_seeded = False


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio

    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def seed_db():
    """Seed the database with initial roles and permissions before tests."""
    global _database_seeded
    if _database_seeded:
        return

    # Import here to avoid circular imports
    import subprocess
    import sys

    # Run the seed script as a subprocess to ensure clean state
    result = subprocess.run(
        [sys.executable, "scripts/seed.py"],
        capture_output=True,
        text=True,
        cwd=str(Path(__file__).parent.parent),
    )
    if result.returncode != 0:
        print(f"Seed script failed: {result.stderr}")
        raise Exception(f"Seed script failed: {result.stderr}")
    print(result.stdout)
    _database_seeded = True


@pytest.fixture
async def client():
    """Test client with database cleanup before each test using a separate Prisma client."""
    # Use a temporary Prisma client for cleanup to avoid event loop conflicts
    temp_prisma = Prisma()
    await temp_prisma.connect()
    try:
        # Clean up test data before each test
        await temp_prisma.refreshtoken.delete_many()
        await temp_prisma.student.delete_many()
        await temp_prisma.teacher.delete_many()
    finally:
        await temp_prisma.disconnect()

    # Now start the TestClient (which uses its own Prisma instance in its own event loop)
    from app.main import app

    with TestClient(app) as client:
        yield client
