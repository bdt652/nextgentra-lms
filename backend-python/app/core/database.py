"""Database connection management."""
from prisma import Prisma
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variables."""
    database_url: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore other environment variables


settings = Settings()

# Global Prisma client instance
prisma = Prisma()


async def connect_db() -> None:
    """Connect to database on application startup."""
    if not prisma.is_connected():
        await prisma.connect()


async def disconnect_db() -> None:
    """Disconnect from database on application shutdown."""
    if prisma.is_connected():
        await prisma.disconnect()


def get_prisma() -> Prisma:
    """Dependency to get Prisma client instance."""
    return prisma
