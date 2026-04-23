"""
Background Log Sync Service

Periodically pulls logs from connected cloud providers (Azure Log Analytics)
and indexes them into Elasticsearch. Runs every SYNC_INTERVAL seconds to
provide near-real-time log visibility in the SIEM dashboard.
"""
import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .. import models
from ..database import SessionLocal
from .elasticsearch import index_logs_bulk, get_es_client
from .azure_provisioner import sync_logs_from_workspace

logger = logging.getLogger(__name__)

# How often to pull logs (in seconds)
SYNC_INTERVAL = 10

# How far back to look each sync cycle (ISO 8601 duration)
# PT2M = last 2 minutes — provides overlap to catch any delayed logs
SYNC_LOOKBACK = "PT2M"

# Background task handle
_sync_task: asyncio.Task | None = None


def _make_doc_id(log: dict) -> str:
    """
    Generate a deterministic document ID from a log entry so that
    re-indexing the same log is idempotent (no duplicates).

    Uses timestamp + source_id + first 200 chars of action as the
    uniqueness key.
    """
    key = f"{log.get('timestamp', '')}|{log.get('source_id', '')}|{log.get('action', '')[:200]}"
    return hashlib.sha256(key.encode()).hexdigest()[:20]


async def _index_with_dedup(logs: list[dict]) -> int:
    """Index logs into Elasticsearch using deterministic doc IDs to prevent duplicates.
    
    Uses op_type='create' for data stream compatibility. If a document with the
    same ID already exists, ES returns 409 Conflict which we silently skip (dedup).
    """
    if not logs:
        return 0

    es = get_es_client()
    from .elasticsearch import get_today_index
    index_name = get_today_index()

    success_count = 0
    skipped_count = 0
    for log in logs:
        try:
            doc_id = _make_doc_id(log)
            await es.index(index=index_name, id=doc_id, document=log, op_type="create")
            success_count += 1
        except Exception as e:
            # 409 Conflict = document already exists (dedup working correctly)
            if "ConflictError" in type(e).__name__ or "conflict" in str(e).lower() or "409" in str(e):
                skipped_count += 1
            else:
                logger.error("Failed to index log with dedup: %s", e)

    if skipped_count > 0:
        logger.debug("[SYNC] Skipped %d duplicate logs", skipped_count)

    return success_count


async def _refresh_token_if_needed(conn: models.CloudConnection, db: AsyncSession) -> str:
    """Refresh Azure OAuth token if expired. Returns the current access token."""
    import os
    import httpx

    if conn.expires_at and conn.expires_at < datetime.now(timezone.utc):
        if conn.refresh_token:
            try:
                client_id = os.getenv("AZURE_CLIENT_ID", "")
                client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
                tenant_id = os.getenv("AZURE_TENANT_ID", "common")

                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
                        data={
                            "client_id": client_id,
                            "client_secret": client_secret,
                            "grant_type": "refresh_token",
                            "refresh_token": conn.refresh_token,
                            "scope": "https://management.azure.com/user_impersonation offline_access",
                        },
                    )

                if resp.status_code == 200:
                    tokens = resp.json()
                    conn.access_token = tokens.get("access_token", conn.access_token)
                    conn.refresh_token = tokens.get("refresh_token", conn.refresh_token)
                    conn.expires_at = datetime.now(timezone.utc) + timedelta(
                        seconds=tokens.get("expires_in", 3600)
                    )
                    await db.commit()
                    logger.info("[SYNC] Refreshed Azure token for user %s", conn.owner_id)
                else:
                    logger.warning("[SYNC] Token refresh failed: %s", resp.status_code)
            except Exception as e:
                logger.warning("[SYNC] Token refresh error: %s", e)

    return conn.access_token


async def _sync_azure_connection(conn: models.CloudConnection, db: AsyncSession):
    """Sync logs for a single Azure cloud connection."""
    if not conn.workspace_id:
        return  # No workspace configured yet — skip

    # Find all Azure log sources for this user
    result = await db.execute(
        select(models.LogSource)
        .where(models.LogSource.owner_id == conn.owner_id)
        .where(models.LogSource.cloud_provider == "azure")
        .where(models.LogSource.is_active == True)
    )
    sources = result.scalars().all()

    if not sources:
        return

    # Refresh token if needed
    access_token = await _refresh_token_if_needed(conn, db)

    for source in sources:
        try:
            logs = await asyncio.to_thread(
                sync_logs_from_workspace,
                access_token,
                conn.workspace_id,
                source.id,
                source.name,
                SYNC_LOOKBACK,
            )

            if logs:
                indexed = await _index_with_dedup(logs)
                if indexed > 0:
                    logger.info(
                        "[SYNC] Indexed %d new logs for source '%s' (id=%d)",
                        indexed, source.name, source.id,
                    )
        except Exception as e:
            logger.error(
                "[SYNC] Error syncing source '%s' (id=%d): %s",
                source.name, source.id, e,
            )


async def _sync_loop():
    """Main background loop — runs every SYNC_INTERVAL seconds."""
    logger.info("[SYNC] Background log sync started (interval=%ds)", SYNC_INTERVAL)

    while True:
        try:
            async with SessionLocal() as db:
                # Find all Azure connections that have a workspace_id
                result = await db.execute(
                    select(models.CloudConnection)
                    .where(models.CloudConnection.provider == "azure")
                    .where(models.CloudConnection.workspace_id.isnot(None))
                )
                connections = result.scalars().all()

                for conn in connections:
                    await _sync_azure_connection(conn, db)

        except Exception as e:
            logger.error("[SYNC] Sync loop error: %s", e)

        await asyncio.sleep(SYNC_INTERVAL)


def start_sync_task():
    """Start the background sync loop. Call during app startup."""
    global _sync_task
    if _sync_task is None or _sync_task.done():
        _sync_task = asyncio.create_task(_sync_loop())
        logger.info("[SYNC] Background sync task created")


async def stop_sync_task():
    """Cancel the background sync loop. Call during app shutdown."""
    global _sync_task
    if _sync_task and not _sync_task.done():
        _sync_task.cancel()
        try:
            await _sync_task
        except asyncio.CancelledError:
            pass
        logger.info("[SYNC] Background sync task stopped")
    _sync_task = None
