"""
GCP Provisioner Service

Uses the Google Cloud Python SDK to list projects and deploy
Log Sinks with Pub/Sub push subscriptions into Pinnacle SIEM.
"""
import os
import logging
from google.oauth2.credentials import Credentials
from google.cloud import logging_v2, pubsub_v1
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

GCP_CLIENT_ID = os.getenv("GCP_CLIENT_ID", "")
GCP_CLIENT_SECRET = os.getenv("GCP_CLIENT_SECRET", "")


def _make_credentials(access_token: str, refresh_token: str) -> Credentials:
    """Build google.oauth2 Credentials from DB-stored tokens."""
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GCP_CLIENT_ID,
        client_secret=GCP_CLIENT_SECRET,
    )


def list_gcp_projects(access_token: str, refresh_token: str) -> list[dict]:
    """
    List all GCP projects accessible by the authenticated user.
    Uses the Cloud Resource Manager API.
    """
    creds = _make_credentials(access_token, refresh_token)
    try:
        service = build("cloudresourcemanager", "v1", credentials=creds)
        result = service.projects().list().execute()
        projects = result.get("projects", [])
        return [
            {
                "project_id": p["projectId"],
                "name": p.get("name", p["projectId"]),
                "state": p.get("lifecycleState", "UNKNOWN"),
            }
            for p in projects
            if p.get("lifecycleState") == "ACTIVE"
        ]
    except Exception as e:
        logger.error(f"Failed to list GCP projects: {e}")
        return []


def deploy_gcp_logging(
    access_token: str,
    refresh_token: str,
    project_id: str,
    siem_webhook_url: str,
) -> dict:
    """
    Creates a Pub/Sub topic, a push subscription pointing at the SIEM
    webhook, and a Cloud Logging sink that routes logs into the topic.

    Args:
        access_token: OAuth token from cloud_connections table
        refresh_token: OAuth refresh token
        project_id: GCP project ID
        siem_webhook_url: The SIEM ingest endpoint for GCP logs
    """
    creds = _make_credentials(access_token, refresh_token)

    topic_id = "pinnacle-siem-logs"
    project_path = f"projects/{project_id}"

    # 1. Create Pub/Sub Topic
    publisher = pubsub_v1.PublisherClient(credentials=creds)
    topic_path = publisher.topic_path(project_id, topic_id)
    try:
        publisher.create_topic(request={"name": topic_path})
        logger.info(f"Created Pub/Sub topic: {topic_path}")
    except Exception as e:
        if "ALREADY_EXISTS" in str(e):
            logger.info(f"Pub/Sub topic already exists: {topic_path}")
        else:
            logger.error(f"Failed to create Pub/Sub topic: {e}")
            return {"status": "error", "detail": f"Topic creation failed: {e}"}

    # 2. Create Push Subscription
    subscriber = pubsub_v1.SubscriberClient(credentials=creds)
    sub_path = subscriber.subscription_path(project_id, "pinnacle-siem-push")
    push_config = pubsub_v1.types.PushConfig(push_endpoint=siem_webhook_url)

    try:
        subscriber.create_subscription(
            request={
                "name": sub_path,
                "topic": topic_path,
                "push_config": push_config,
            }
        )
        logger.info(f"Created push subscription: {sub_path}")
    except Exception as e:
        if "ALREADY_EXISTS" in str(e):
            logger.info(f"Push subscription already exists: {sub_path}")
        else:
            logger.error(f"Failed to create push subscription: {e}")
            return {"status": "error", "detail": f"Subscription creation failed: {e}"}

    # 3. Create Log Sink
    logging_client = logging_v2.ConfigServiceV2Client(credentials=creds)
    sink = {
        "name": "pinnacle-siem-sink",
        "destination": f"pubsub.googleapis.com/{topic_path}",
        "filter": "severity >= INFO",
    }

    try:
        logging_client.create_sink(
            request={"parent": project_path, "sink": sink}
        )
        logger.info(f"Created log sink for project {project_id}")
    except Exception as e:
        if "ALREADY_EXISTS" in str(e):
            logger.info(f"Log sink already exists for project {project_id}")
        else:
            logger.error(f"Failed to create log sink: {e}")
            return {"status": "error", "detail": f"Sink creation failed: {e}"}

    return {"status": "success", "project_id": project_id}
