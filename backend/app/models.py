import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base


def generate_api_key() -> str:
    """Generate a unique API key for a log source."""
    return f"ps_{uuid.uuid4().hex}"


class LogSource(Base):
    """Tracks configured cloud log sources (AWS, Azure, GCP, Python, Node.js, Docker, etc.)."""
    __tablename__ = "log_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Production Billing Service"
    cloud_provider = Column(String, nullable=False)  # "aws" | "azure" | "gcp" | "python" | "nodejs" | "docker" | "curl"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Per-source API key for ingestion auth
    api_key = Column(String, unique=True, nullable=False, default=generate_api_key)

    # Connection status: "waiting" | "connected" | "inactive"
    status = Column(String, nullable=False, default="waiting")

    # Links to user table managed by Drizzle (no SQLAlchemy FK)
    owner_id = Column(String, nullable=False)
