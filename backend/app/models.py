from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # RELATIONSHIP: This links to the 'user' table managed by Next.js/Drizzle
    # We don't use ForeignKey() here because the 'user' table is managed externally by Drizzle.
    # The database-level FK constraint is created in the Alembic migration.
    owner_id = Column(String, nullable=False)
