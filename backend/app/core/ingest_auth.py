from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..database import get_db
from .. import models


async def verify_ingest_token(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> models.LogSource:
    """Verify the per-source API key sent by external agents.
    
    Instead of comparing against a global .env var, this looks up 
    the API key in the database to resolve it to a specific LogSource.
    Returns the LogSource ORM object so routers can use source_id.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header"
        )

    result = await db.execute(
        select(models.LogSource).where(models.LogSource.api_key == x_api_key)
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid API Key"
        )

    if not source.is_active:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Source is inactive"
        )

    return source
