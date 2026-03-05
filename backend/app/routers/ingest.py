from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .. import schemas, models
from ..services import normalizer
from ..services.elasticsearch import index_logs_bulk
from ..core.ingest_auth import verify_ingest_token
from ..database import get_db

router = APIRouter(prefix="/ingest", tags=["Log Ingestion"])


async def _flip_status_if_waiting(source: models.LogSource, db: AsyncSession):
    """On first successful ingest, flip source status from 'waiting' to 'connected'."""
    if source.status == "waiting":
        source.status = "connected"
        db.add(source)
        await db.commit()
        await db.refresh(source)


@router.post("/aws", summary="Ingest AWS logs")
async def ingest_aws(
    payload: schemas.AWSIngestPayload,
    source: models.LogSource = Depends(verify_ingest_token),
    db: AsyncSession = Depends(get_db),
):
    """Receive raw Nginx/syslog lines from Filebeat agent on AWS EC2.

    Expected format:
    ```json
    {"logs": ["192.168.1.1 - - [10/Oct/2023:13:55:36] \"GET / HTTP/1.1\" 200"]}
    ```
    """
    normalized = normalizer.normalize_log(
        payload.logs, "aws",
        source_id=source.id, source_name=source.name,
    )
    indexed = await index_logs_bulk(normalized)
    await _flip_status_if_waiting(source, db)
    return {
        "status": "ok",
        "cloud_provider": "aws",
        "source_id": source.id,
        "received": len(payload.logs),
        "indexed": indexed,
    }


@router.post("/azure", summary="Ingest Azure logs")
async def ingest_azure(
    payload: schemas.AzureIngestPayload,
    source: models.LogSource = Depends(verify_ingest_token),
    db: AsyncSession = Depends(get_db),
):
    """Receive Azure Diagnostic Settings JSON records via webhook."""
    normalized = normalizer.normalize_log(
        payload.records, "azure",
        source_id=source.id, source_name=source.name,
    )
    indexed = await index_logs_bulk(normalized)
    await _flip_status_if_waiting(source, db)
    return {
        "status": "ok",
        "cloud_provider": "azure",
        "source_id": source.id,
        "received": len(payload.records),
        "indexed": indexed,
    }


@router.post("/gcp", summary="Ingest GCP logs")
async def ingest_gcp(
    payload: schemas.GCPIngestPayload,
    source: models.LogSource = Depends(verify_ingest_token),
    db: AsyncSession = Depends(get_db),
):
    """Receive GCP Cloud Logging Pub/Sub messages via HTTP sink."""
    normalized = normalizer.normalize_log(
        payload.message, "gcp",
        source_id=source.id, source_name=source.name,
    )
    indexed = await index_logs_bulk(normalized)
    await _flip_status_if_waiting(source, db)
    return {
        "status": "ok",
        "cloud_provider": "gcp",
        "source_id": source.id,
        "received": 1,
        "indexed": indexed,
    }


@router.post("/generic", summary="Ingest generic logs (Python, Node.js, Docker, cURL)")
async def ingest_generic(
    payload: schemas.GenericIngestPayload,
    source: models.LogSource = Depends(verify_ingest_token),
    db: AsyncSession = Depends(get_db),
):
    """Receive JSON log objects from any application (Python, Node.js, Docker, cURL).

    Expected format:
    ```json
    {"logs": [{"message": "User logged in", "level": "info", "timestamp": "..."}]}
    ```
    """
    normalized = normalizer.normalize_generic_logs(
        payload.logs,
        source_id=source.id,
        source_name=source.name,
        cloud_provider=source.cloud_provider,
    )
    indexed = await index_logs_bulk(normalized)
    await _flip_status_if_waiting(source, db)
    return {
        "status": "ok",
        "source_id": source.id,
        "source_type": source.cloud_provider,
        "received": len(payload.logs),
        "indexed": indexed,
    }
