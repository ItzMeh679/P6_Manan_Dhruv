from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from .. import models, schemas, database
from ..deps import get_current_user_id

router = APIRouter(prefix="/sources", tags=["Log Sources"])

get_db = database.get_db


@router.get("/", response_model=List[schemas.LogSource], summary="List log sources")
async def list_sources(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """List all configured cloud log sources for the current user."""
    result = await db.execute(
        select(models.LogSource)
        .where(models.LogSource.owner_id == user_id)
        .order_by(models.LogSource.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=schemas.LogSource, summary="Create log source")
async def create_source(
    source: schemas.LogSourceCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Register a new cloud log source (AWS, Azure, or GCP)."""
    if source.cloud_provider not in ("aws", "azure", "gcp"):
        raise HTTPException(
            status_code=400,
            detail="cloud_provider must be one of: aws, azure, gcp"
        )

    db_source = models.LogSource(**source.model_dump(), owner_id=user_id)
    db.add(db_source)
    await db.commit()
    await db.refresh(db_source)
    return db_source


@router.delete("/{source_id}", summary="Delete log source")
async def delete_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a configured cloud log source."""
    result = await db.execute(
        select(models.LogSource)
        .where(models.LogSource.id == source_id)
        .where(models.LogSource.owner_id == user_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    await db.delete(source)
    await db.commit()
    return {"status": "deleted", "id": source_id}
