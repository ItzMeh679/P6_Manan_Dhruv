from fastapi import APIRouter, Depends, Query
from typing import Optional
from ..services.elasticsearch import search_logs, get_log_stats
from ..deps import get_current_user_id

router = APIRouter(prefix="/logs", tags=["Log Search"])


@router.get("/search", summary="Search logs")
async def search(
    q: Optional[str] = Query(None, description="Full-text search query"),
    cloud_provider: Optional[str] = Query(None, description="Filter by cloud provider: aws, azure, gcp"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    user_id: str = Depends(get_current_user_id),
):
    """Search and filter logs stored in Elasticsearch.
    
    Protected by BFF auth — only authenticated dashboard users can search.
    """
    result = await search_logs(
        q=q,
        cloud_provider=cloud_provider,
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
    """Get aggregate statistics: total logs, breakdown by provider, recent logs.
    
    Protected by BFF auth.
    """
    return await get_log_stats()
