from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from .. import models, schemas, database
from ..deps import get_current_user_id
from ..models import generate_api_key

router = APIRouter(prefix="/sources", tags=["Log Sources"])

get_db = database.get_db

# Allowed source types
ALLOWED_PROVIDERS = ("aws", "azure", "gcp", "python", "nodejs", "docker", "curl")


@router.get("/", response_model=List[schemas.LogSource], summary="List log sources")
async def list_sources(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """List all configured log sources for the current user."""
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
    """Register a new log source. Auto-generates a unique API key."""
    if source.cloud_provider not in ALLOWED_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"cloud_provider must be one of: {', '.join(ALLOWED_PROVIDERS)}"
        )

    db_source = models.LogSource(
        **source.model_dump(),
        owner_id=user_id,
        api_key=generate_api_key(),
        status="waiting",
    )
    db.add(db_source)
    await db.commit()
    await db.refresh(db_source)
    return db_source


@router.get("/{source_id}/status", response_model=schemas.LogSourceStatus, summary="Get source status")
async def get_source_status(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Check the connection status of a specific source (for polling during onboarding)."""
    result = await db.execute(
        select(models.LogSource)
        .where(models.LogSource.id == source_id)
        .where(models.LogSource.owner_id == user_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    return {"id": source.id, "status": source.status, "name": source.name}


@router.delete("/{source_id}", summary="Delete log source")
async def delete_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a configured log source."""
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
