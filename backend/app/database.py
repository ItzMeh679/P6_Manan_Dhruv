import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Get DB URL from env, modify protocol for asyncpg
DATABASE_URL = os.getenv("DATABASE_URL", "")
# Docker passes "postgres://...", SQLAlchemy Async needs "postgresql+asyncpg://..."
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# Dependency for FastAPI routes
async def get_db():
    async with SessionLocal() as session:
        yield session
