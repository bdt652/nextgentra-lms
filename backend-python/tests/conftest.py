"""Pytest configuration and fixtures for integration tests."""

import asyncio
from pathlib import Path
import subprocess
import sys

from fastapi.testclient import TestClient
import pytest

from prisma import Prisma

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(scope="session", autouse=True)
def seed_db():
    """Seed the database with initial roles and permissions before tests."""
    result = subprocess.run(
        [sys.executable, "scripts/seed.py"],
        capture_output=True,
        text=True,
        cwd=str(Path(__file__).parent.parent),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Seed script failed: {result.stderr}")
    print(result.stdout)


async def _cleanup_db() -> None:
    """Clean all test data from the database."""
    db = Prisma()
    await db.connect()
    try:
        await db.refreshtoken.delete_many()
        await db.student.delete_many()
        await db.teacher.delete_many()
    finally:
        await db.disconnect()


@pytest.fixture
def client():
    """Test client with database cleanup before each test."""
    asyncio.run(_cleanup_db())

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
