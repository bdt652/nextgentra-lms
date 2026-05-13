"""Database connection management."""

from pydantic_settings import BaseSettings, SettingsConfigDict

from prisma import Prisma  # type: ignore


class Settings(BaseSettings):
    """Application settings with environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = ""
    redis_url: str = ""  # Redis connection URL
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7


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
