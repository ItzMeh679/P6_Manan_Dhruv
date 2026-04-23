"""
Cloud Auth Router

Handles the OAuth 2.0 Authorization Code Flow for Azure and GCP.
Provides endpoints to:
- Start OAuth login (redirect to provider)
- Handle OAuth callbacks (exchange code for tokens, save to DB)
- List/delete cloud connections
- List cloud resources (VMs, projects, etc.)
- Deploy logging infrastructure on user's cloud resources
"""
import asyncio
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import List
from urllib.parse import quote, unquote

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user_id
from ..services.azure_provisioner import list_azure_resources, deploy_azure_logging, sync_logs_from_workspace
from ..services.gcp_provisioner import list_gcp_projects, deploy_gcp_logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cloud", tags=["Cloud Auth"])

# ==========================================
# Environment Variables
# ==========================================
AZURE_CLIENT_ID = os.getenv("AZURE_CLIENT_ID", "")
AZURE_CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET", "")
AZURE_TENANT_ID = os.getenv("AZURE_TENANT_ID", "common")
AZURE_REDIRECT_URI = os.getenv(
    "AZURE_REDIRECT_URI",
    "http://localhost/api/py/cloud/azure/callback",
)

GCP_CLIENT_ID = os.getenv("GCP_CLIENT_ID", "")
GCP_CLIENT_SECRET = os.getenv("GCP_CLIENT_SECRET", "")
GCP_REDIRECT_URI = os.getenv(
    "GCP_REDIRECT_URI",
    "http://localhost/api/py/cloud/gcp/callback",
)

# Frontend URL for post-OAuth redirects
FRONTEND_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")


# ==========================================
# Token Refresh Helper
# ==========================================


async def _refresh_azure_token_if_expired(
    conn: models.CloudConnection,
    db: AsyncSession,
    user_id: str,
) -> str:
    """
    Checks if the Azure access token is expired and refreshes it if possible.
    Returns the (possibly refreshed) access token.
    """
    if conn.expires_at and conn.expires_at < datetime.now(timezone.utc):
        logger.info(f"Azure token expired for user {user_id}, refreshing...")
        print(f"[AZURE] Token expired (expired at {conn.expires_at}), attempting refresh...")
        if conn.refresh_token:
            try:
                async with httpx.AsyncClient() as client:
                    token_res = await client.post(
                        f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token",
                        data={
                            "client_id": AZURE_CLIENT_ID,
                            "client_secret": AZURE_CLIENT_SECRET,
                            "grant_type": "refresh_token",
                            "refresh_token": conn.refresh_token,
                            "scope": "https://management.azure.com/user_impersonation offline_access",
                        },
                    )
                if token_res.status_code == 200:
                    tokens = token_res.json()
                    conn.access_token = tokens.get("access_token", conn.access_token)
                    conn.refresh_token = tokens.get("refresh_token", conn.refresh_token)
                    conn.expires_at = datetime.now(timezone.utc) + timedelta(
                        seconds=tokens.get("expires_in", 3600)
                    )
                    await db.commit()
                    print(f"[AZURE] Token refreshed successfully, new expiry: {conn.expires_at}")
                else:
                    print(f"[AZURE] Token refresh FAILED: {token_res.status_code} {token_res.text[:300]}")
            except Exception as e:
                print(f"[AZURE] Token refresh exception: {type(e).__name__}: {e}")
        else:
            print("[AZURE] No refresh token available, cannot refresh")
    return conn.access_token


# ==========================================
# Azure OAuth Flow
# ==========================================


@router.get("/azure/login", summary="Start Azure OAuth login")
async def azure_login(user_id: str = Query(..., description="The authenticated user ID")):
    """Redirects the user to Microsoft's OAuth consent screen."""
    if not AZURE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="AZURE_CLIENT_ID not configured")

    scopes = "https://management.azure.com/user_impersonation offline_access"
    state = quote(user_id)  # URL-safe encoding of user_id

    auth_url = (
        f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/authorize?"
        f"client_id={AZURE_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={quote(AZURE_REDIRECT_URI)}"
        f"&response_mode=query"
        f"&scope={quote(scopes)}"
        f"&state={state}"
    )
    return RedirectResponse(auth_url)


@router.get("/azure/callback", summary="Azure OAuth callback")
async def azure_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Microsoft redirects here after user consents.
    Exchanges the authorization code for tokens and saves them to the DB.
    """
    owner_id = unquote(state)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token",
            data={
                "client_id": AZURE_CLIENT_ID,
                "client_secret": AZURE_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": AZURE_REDIRECT_URI,
                "scope": "https://management.azure.com/user_impersonation offline_access",
            },
        )

    if token_res.status_code != 200:
        logger.error(f"Azure token exchange failed: {token_res.text}")
        return RedirectResponse(f"{FRONTEND_URL}/dashboard/sources?error=azure_token_failed")

    tokens = token_res.json()
    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")
    expires_in = tokens.get("expires_in", 3600)

    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard/sources?error=azure_no_token")

    # Upsert: delete existing Azure connection for this user, then insert new one
    existing = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == owner_id)
        .where(models.CloudConnection.provider == "azure")
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)

    connection = models.CloudConnection(
        owner_id=owner_id,
        provider="azure",
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    )
    db.add(connection)
    await db.commit()

    logger.info(f"Azure OAuth completed for user {owner_id}")
    return RedirectResponse(f"{FRONTEND_URL}/dashboard/sources?connected=azure")


# ==========================================
# GCP OAuth Flow
# ==========================================


@router.get("/gcp/login", summary="Start GCP OAuth login")
async def gcp_login(user_id: str = Query(..., description="The authenticated user ID")):
    """Redirects the user to Google's OAuth consent screen."""
    if not GCP_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GCP_CLIENT_ID not configured")

    scopes = "https://www.googleapis.com/auth/cloud-platform"
    state = quote(user_id)

    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GCP_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={quote(GCP_REDIRECT_URI)}"
        f"&scope={quote(scopes)}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return RedirectResponse(auth_url)


@router.get("/gcp/callback", summary="GCP OAuth callback")
async def gcp_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Google redirects here after user consents.
    Exchanges the authorization code for tokens and saves them to the DB.
    """
    owner_id = unquote(state)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GCP_CLIENT_ID,
                "client_secret": GCP_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": GCP_REDIRECT_URI,
            },
        )

    if token_res.status_code != 200:
        logger.error(f"GCP token exchange failed: {token_res.text}")
        return RedirectResponse(f"{FRONTEND_URL}/dashboard/sources?error=gcp_token_failed")

    tokens = token_res.json()
    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")
    expires_in = tokens.get("expires_in", 3600)

    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard/sources?error=gcp_no_token")

    # Upsert: delete existing GCP connection for this user, then insert new one
    existing = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == owner_id)
        .where(models.CloudConnection.provider == "gcp")
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)

    connection = models.CloudConnection(
        owner_id=owner_id,
        provider="gcp",
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    )
    db.add(connection)
    await db.commit()

    logger.info(f"GCP OAuth completed for user {owner_id}")
    return RedirectResponse(f"{FRONTEND_URL}/dashboard/sources?connected=gcp")


# ==========================================
# Connection Management (Authenticated)
# ==========================================


@router.get(
    "/connections",
    response_model=List[schemas.CloudConnectionOut],
    summary="List connected cloud accounts",
)
async def list_connections(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Returns all cloud accounts the user has connected via OAuth."""
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == user_id)
        .order_by(models.CloudConnection.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/connections/{connection_id}", summary="Disconnect a cloud account")
async def delete_connection(
    connection_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Removes stored OAuth tokens for a cloud account."""
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.id == connection_id)
        .where(models.CloudConnection.owner_id == user_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    await db.delete(conn)
    await db.commit()
    return {"status": "disconnected", "id": connection_id}


# ==========================================
# Cloud Resource Discovery
# ==========================================


@router.get("/azure/resources", summary="List Azure resources")
async def get_azure_resources(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Lists all Azure resources (VMs, App Services, Databases, etc.)
    accessible by the user's connected Azure account.
    """
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == user_id)
        .where(models.CloudConnection.provider == "azure")
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No Azure account connected. Please connect first.")

    # Auto-refresh token if expired
    access_token = await _refresh_azure_token_if_expired(conn, db, user_id)

    resources = await asyncio.to_thread(list_azure_resources, access_token)
    return {"provider": "azure", "resources": resources}


@router.get("/gcp/resources", summary="List GCP projects")
async def get_gcp_resources(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Lists all GCP projects accessible by the user's connected GCP account.
    """
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == user_id)
        .where(models.CloudConnection.provider == "gcp")
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No GCP account connected. Please connect first.")

    projects = await asyncio.to_thread(list_gcp_projects, conn.access_token, conn.refresh_token)
    return {"provider": "gcp", "resources": projects}


# ==========================================
# Deploy Logging Infrastructure
# ==========================================


@router.post("/azure/deploy-logging", summary="Deploy Azure Diagnostic Setting")
async def deploy_azure(
    req: schemas.DeployAzureLoggingRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Creates an Azure Diagnostic Setting on the specified resource
    to forward logs into Pinnacle SIEM. Also auto-registers a log source
    and triggers initial log sync from Log Analytics.
    """
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == user_id)
        .where(models.CloudConnection.provider == "azure")
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No Azure account connected")

    # Auto-refresh token if expired
    access_token = await _refresh_azure_token_if_expired(conn, db, user_id)

    # Build the SIEM webhook URL for Azure ingest
    siem_url = os.getenv("SIEM_WEBHOOK_URL", f"{FRONTEND_URL}/api/py/ingest/azure")

    deploy_result = deploy_azure_logging(
        access_token=access_token,
        subscription_id=req.subscription_id,
        resource_uri=req.resource_uri,
        siem_webhook_url=siem_url,
    )

    if deploy_result.get("status") == "error":
        raise HTTPException(status_code=500, detail=deploy_result.get("detail"))

    # === Auto-register a log source for the resource ===
    resource_name = req.resource_uri.split("/")[-1]  # e.g. "incheshealth-demo-backend"
    source_name = f"Azure: {resource_name}"

    # Check if a source for this resource already exists
    existing_source = await db.execute(
        select(models.LogSource)
        .where(models.LogSource.owner_id == user_id)
        .where(models.LogSource.name == source_name)
    )
    source = existing_source.scalar_one_or_none()

    if not source:
        import secrets
        source = models.LogSource(
            name=source_name,
            cloud_provider="azure",
            description=f"Auto-created from Azure diagnostic settings on {resource_name}",
            is_active=True,
            api_key=secrets.token_urlsafe(32),
            status="connected",
            owner_id=user_id,
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)
        print(f"[AZURE] Auto-created log source: {source_name} (id={source.id})")
    else:
        print(f"[AZURE] Log source already exists: {source_name} (id={source.id})")

    # === Trigger background log sync from Log Analytics ===
    workspace_id = deploy_result.get("workspace_id")

    # Save workspace_id on the connection for the background sync task
    if workspace_id:
        conn.workspace_id = workspace_id
        await db.commit()
        print(f"[AZURE] Saved workspace_id on cloud connection for background sync")

    if workspace_id and source:
        async def _background_sync():
            """Pull logs from Log Analytics and index into Elasticsearch."""
            import asyncio
            # Wait a bit for Azure to start collecting logs
            await asyncio.sleep(2)
            try:
                logs = await asyncio.to_thread(
                    sync_logs_from_workspace,
                    access_token,
                    workspace_id,
                    source.id,
                    source.name,
                    "PT24H",  # Look back 24 hours for initial sync
                )
                if logs:
                    from ..services.elasticsearch import index_logs_bulk
                    indexed = await index_logs_bulk(logs)
                    print(f"[AZURE] Synced {indexed}/{len(logs)} logs into SIEM")
                else:
                    print("[AZURE] No logs available yet (may take 5-10 min for new diagnostic settings)")
            except Exception as e:
                print(f"[AZURE] Background sync error: {type(e).__name__}: {e}")

        # Fire and forget the background sync
        asyncio.ensure_future(_background_sync())

    deploy_result["source_id"] = source.id if source else None
    deploy_result["source_name"] = source_name
    return deploy_result


@router.post("/azure/sync-logs", summary="Sync Azure logs from Log Analytics")
async def sync_azure_logs(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Manually pull logs from Azure Log Analytics into the SIEM."""
    # Get azure connection
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == user_id)
        .where(models.CloudConnection.provider == "azure")
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No Azure account connected")

    access_token = await _refresh_azure_token_if_expired(conn, db, user_id)

    # Find the log source
    source_result = await db.execute(
        select(models.LogSource)
        .where(models.LogSource.owner_id == user_id)
        .where(models.LogSource.cloud_provider == "azure")
    )
    source = source_result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="No Azure log source registered")

    # Use stored workspace_id if available, otherwise discover it
    workspace_id = conn.workspace_id
    if not workspace_id:
        from ..services.azure_provisioner import _find_or_create_log_analytics_workspace
        workspace_id = _find_or_create_log_analytics_workspace(
            access_token, "3daa8bc3-06d5-4e5e-ba7d-e43dddf050a7",
            "rg-incheshealth-demo", "centralindia",
        )
        # Save it for future use by the background sync
        if workspace_id:
            conn.workspace_id = workspace_id
            await db.commit()

    if not workspace_id:
        raise HTTPException(status_code=500, detail="Could not find Log Analytics workspace")

    logs = await asyncio.to_thread(
        sync_logs_from_workspace,
        access_token,
        workspace_id,
        source.id,
        source.name,
        "P1D",  # last 24 hours
    )

    if logs:
        from ..services.elasticsearch import index_logs_bulk
        indexed = await index_logs_bulk(logs)
        return {"status": "success", "synced": indexed, "total": len(logs)}
    else:
        return {"status": "no_logs", "detail": "No logs found in Log Analytics workspace"}

@router.post("/gcp/deploy-logging", summary="Deploy GCP Log Sink")
async def deploy_gcp(
    req: schemas.DeployGCPLoggingRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Creates a GCP Pub/Sub topic + push subscription + Log Sink
    to forward logs into Pinnacle SIEM.
    """
    result = await db.execute(
        select(models.CloudConnection)
        .where(models.CloudConnection.owner_id == user_id)
        .where(models.CloudConnection.provider == "gcp")
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="No GCP account connected")

    siem_url = os.getenv("SIEM_WEBHOOK_URL", f"{FRONTEND_URL}/api/py/ingest/gcp")

    deploy_result = deploy_gcp_logging(
        access_token=conn.access_token,
        refresh_token=conn.refresh_token,
        project_id=req.project_id,
        siem_webhook_url=siem_url,
    )

    if deploy_result.get("status") == "error":
        raise HTTPException(status_code=500, detail=deploy_result.get("detail"))

    return deploy_result
