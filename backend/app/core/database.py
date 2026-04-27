"""Database connection module using Prisma."""
from prisma import Prisma
from app.core.config import settings

db = Prisma()


async def connect_db():
    """Connect to the database."""
    await db.connect()


async def disconnect_db():
    """Disconnect from the database."""
    await db.disconnect()
