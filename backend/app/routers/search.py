from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from ..services.elasticsearch import search_logs, get_log_stats, get_source_stats
from ..deps import get_current_user_id

router = APIRouter(prefix="/logs", tags=["Log Search"])


@router.get("/search", summary="Search logs")
async def search(
    q: Optional[str] = Query(None, description="Full-text search query"),
    cloud_provider: Optional[str] = Query(None, description="Filter by cloud provider"),
    source_id: Optional[int] = Query(None, description="Filter by specific source ID"),
    source_ids: Optional[str] = Query(None, description="Comma-separated source IDs for multi-source filtering"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    user_id: str = Depends(get_current_user_id),
):
    """Search and filter logs stored in Elasticsearch.

    Supports filtering by source_id or multiple source_ids (comma-separated).
    Protected by BFF auth — only authenticated dashboard users can search.
    """
    # Parse comma-separated source IDs
    parsed_source_ids: Optional[List[int]] = None
    if source_ids:
        try:
            parsed_source_ids = [int(sid.strip()) for sid in source_ids.split(",") if sid.strip()]
        except ValueError:
            parsed_source_ids = None

    result = await search_logs(
        q=q,
        cloud_provider=cloud_provider,
        source_id=source_id,
        source_ids=parsed_source_ids,
        source_ip=source_ip,
        start_date=start_date,
        end_date=end_date,
        page=page,
        size=size,
    )
    return result


@router.get("/stats", summary="Get log statistics")
async def stats(
    user_id: str = Depends(get_current_user_id),
):
    """Get aggregate statistics: total logs, breakdown by provider, by source, recent logs.

    Protected by BFF auth.
    """
    return await get_log_stats()


@router.get("/stats/{source_id}", summary="Get source-specific stats")
async def source_stats(
    source_id: int,
    user_id: str = Depends(get_current_user_id),
):
    """Get quick stats for a specific source (total logs, error rates).

    Protected by BFF auth.
    """
    return await get_source_stats(source_id)
