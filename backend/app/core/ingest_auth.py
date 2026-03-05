from fastapi import Header, HTTPException
import os


async def verify_ingest_token(
    x_ingest_api_key: str = Header(...)
):
    """Verify the ingest API key sent by external cloud agents.
    
    This is separate from the BFF auth (X-Internal-Api-Key) used 
    by the Next.js frontend. Cloud agents (Filebeat, Azure webhooks, 
    GCP sinks) use this key to authenticate their log pushes.
    """
    expected_key = os.getenv("INGEST_API_KEY")

    if not expected_key:
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: INGEST_API_KEY not set"
        )

    if x_ingest_api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid Ingest API Key"
        )

    return True
