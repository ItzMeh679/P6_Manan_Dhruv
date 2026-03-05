from fastapi import APIRouter, Depends
from .. import schemas
from ..services import normalizer
from ..services.elasticsearch import index_logs_bulk
from ..core.ingest_auth import verify_ingest_token

router = APIRouter(prefix="/ingest", tags=["Log Ingestion"])


@router.post("/aws", summary="Ingest AWS logs (Filebeat)")
async def ingest_aws(
    payload: schemas.AWSIngestPayload,
    _: bool = Depends(verify_ingest_token),
):
    """Receive raw Nginx/syslog lines from Filebeat agent on AWS EC2.
    
    Expected format:
    ```json
    {"logs": ["192.168.1.1 - - [10/Oct/2023:13:55:36] \"GET / HTTP/1.1\" 200"]}
    ```
    """
    normalized = normalizer.normalize_log(payload.logs, "aws")
    indexed = await index_logs_bulk(normalized)
    return {
        "status": "ok",
        "cloud_provider": "aws",
        "received": len(payload.logs),
        "indexed": indexed,
    }


@router.post("/azure", summary="Ingest Azure logs (Diagnostic Settings Webhook)")
async def ingest_azure(
    payload: schemas.AzureIngestPayload,
    _: bool = Depends(verify_ingest_token),
):
    """Receive Azure Diagnostic Settings JSON records via webhook.
    
    Expected format:
    ```json
    {"records": [{"callerIpAddress": "10.0.0.1", "operationName": "...", "resultType": "Success"}]}
    ```
    """
    normalized = normalizer.normalize_log(payload.records, "azure")
    indexed = await index_logs_bulk(normalized)
    return {
        "status": "ok",
        "cloud_provider": "azure",
        "received": len(payload.records),
        "indexed": indexed,
    }


@router.post("/gcp", summary="Ingest GCP logs (Log Router Sink)")
async def ingest_gcp(
    payload: schemas.GCPIngestPayload,
    _: bool = Depends(verify_ingest_token),
):
    """Receive GCP Cloud Logging Pub/Sub messages via HTTP sink.
    
    Expected format:
    ```json
    {"message": {"data": "<base64-encoded-json>"}}
    ```
    """
    normalized = normalizer.normalize_log(payload.message, "gcp")
    indexed = await index_logs_bulk(normalized)
    return {
        "status": "ok",
        "cloud_provider": "gcp",
        "received": 1,
        "indexed": indexed,
    }
