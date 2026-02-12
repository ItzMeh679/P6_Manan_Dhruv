from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Base Schema
class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True

# Input Schema (Creation)
class ItemCreate(ItemBase):
    pass

# Output Schema (Reading)
class Item(ItemBase):
    id: int
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True
