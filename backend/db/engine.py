import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://labasi:labasi@localhost:5432/labasi",
)

engine = create_async_engine(DATABASE_URL, echo=False)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db(seed: bool = True) -> None:
    """Create all tables and optionally seed demo data. Call on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    if seed:
        from .seed import seed_demo_data

        async with async_session_factory() as session:
            await seed_demo_data(session)


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for database sessions."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
