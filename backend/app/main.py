from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from . import models, schemas, database, deps

app = FastAPI(title="Template Backend API")

# DB Dependency
get_db = database.get_db

@app.get("/")
def read_root():
    return {"status": "Backend is running", "phase": "3"}

# --- GENERIC CRUD ENDPOINTS ---

@app.post("/items/", response_model=schemas.Item)
async def create_item(
    item: schemas.ItemCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(deps.get_current_user_id) # Securely gets ID from header
):
    # We automatically assign the item to the user ID found in the header
    db_item = models.Item(**item.model_dump(), owner_id=user_id)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@app.get("/items/", response_model=List[schemas.Item])
async def read_items(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(deps.get_current_user_id)
):
    # We filter items so users only see THEIR own data
    result = await db.execute(
        select(models.Item)
        .where(models.Item.owner_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    return items
