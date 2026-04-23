"""
AI Insights Router

Endpoints for querying AI-generated security alerts, statistics, and
managing alert lifecycle (dismiss/acknowledge).
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from ..services.ai_alerts import search_ai_alerts, get_alert_stats, dismiss_alert
from ..services.ai_monitor import get_monitor_status
from ..deps import get_current_user_id

router = APIRouter(prefix="/ai", tags=["AI Insights"])


@router.get("/alerts", summary="Search AI-generated alerts")
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low, info"),
    category: Optional[str] = Query(None, description="Filter by category: security, website_failure, performance, etc."),
    dismissed: Optional[bool] = Query(None, description="Filter by dismissed status"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    user_id: str = Depends(get_current_user_id),
):
    """Search and filter AI-generated alerts.

    Supports filtering by severity, category, date range, and dismiss status.
    Protected by BFF auth — only authenticated dashboard users can query.
    """
    return await search_ai_alerts(
        severity=severity,
        category=category,
        dismissed=dismissed,
        start_date=start_date,
        end_date=end_date,
        page=page,
        size=size,
    )


@router.get("/stats", summary="Get AI alert statistics")
async def alert_stats(
    user_id: str = Depends(get_current_user_id),
):
    """Get aggregate statistics: total active alerts, breakdown by severity and category.

    Protected by BFF auth.
    """
    return await get_alert_stats()


@router.post("/alerts/{alert_id}/dismiss", summary="Dismiss an alert")
async def dismiss(
    alert_id: str,
    index: str = Query(..., description="Elasticsearch index of the alert"),
    user_id: str = Depends(get_current_user_id),
):
    """Mark an alert as dismissed/acknowledged.

    Protected by BFF auth.
    """
    success = await dismiss_alert(index=index, alert_id=alert_id)
    if success:
        return {"status": "dismissed", "alert_id": alert_id}
    return {"status": "error", "detail": "Failed to dismiss alert"}


@router.get("/status", summary="Get AI monitor status")
async def monitor_status(
    user_id: str = Depends(get_current_user_id),
):
    """Check if the AI monitoring background task is active and when last analysis ran.

    Protected by BFF auth.
    """
    return get_monitor_status()
