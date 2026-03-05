from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base


class LogSource(Base):
    """Tracks configured cloud log sources (AWS, Azure, GCP)."""
    __tablename__ = "log_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Production AWS EC2"
    cloud_provider = Column(String, nullable=False)  # "aws" | "azure" | "gcp"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Links to user table managed by Drizzle (no SQLAlchemy FK)
    owner_id = Column(String, nullable=False)
