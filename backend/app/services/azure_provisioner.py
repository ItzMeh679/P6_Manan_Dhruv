"""
Azure Provisioner Service

Uses the Azure Management SDK to list resources and the Azure Monitor
REST API to deploy Diagnostic Settings that forward logs into Pinnacle SIEM.
"""
import logging
from datetime import datetime, timezone
import httpx
from azure.core.credentials import AccessToken
from azure.mgmt.resource import ResourceManagementClient

logger = logging.getLogger(__name__)

# Azure Monitor REST API version for diagnostic settings
DIAGNOSTIC_SETTINGS_API_VERSION = "2021-05-01-preview"


class DBTokenCredential:
    """Wraps a database-stored access token so Azure SDKs can consume it."""
    def __init__(self, token: str, expires_on: int = 2000000000):
        self._token = token
        self._expires_on = expires_on

    def get_token(self, *scopes, **kwargs):
        return AccessToken(self._token, self._expires_on)


def list_azure_resources(access_token: str) -> list[dict]:
    """
    Enumerate the user's Azure subscriptions and their resources.
    Uses the ARM REST API for subscriptions, SDK for resources.
    """
    credential = DBTokenCredential(access_token)
    headers = {"Authorization": f"Bearer {access_token}"}

    print(f"[AZURE] list_azure_resources called, token starts with: {access_token[:20]}...")

    # 1. List subscriptions via REST (avoids needing azure-mgmt-subscription)
    subscriptions = []
    try:
        resp = httpx.get(
            "https://management.azure.com/subscriptions?api-version=2022-12-01",
            headers=headers,
            timeout=15.0,
        )
        print(f"[AZURE] Subscriptions API response status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"[AZURE] Subscriptions API error body: {resp.text[:500]}")
        resp.raise_for_status()
        sub_data = resp.json().get("value", [])
        print(f"[AZURE] Found {len(sub_data)} subscriptions")
        for sub in sub_data:
            subscriptions.append({
                "subscription_id": sub["subscriptionId"],
                "display_name": sub.get("displayName", sub["subscriptionId"]),
            })
    except Exception as e:
        print(f"[AZURE] FAILED to list subscriptions: {type(e).__name__}: {e}")
        logger.error(f"Failed to list Azure subscriptions: {e}")
        return []

    # 2. For each subscription, list resources via SDK
    #    Cap at 200 resources per subscription to prevent excessively long enumeration
    MAX_RESOURCES_PER_SUB = 200
    all_resources = []
    for sub in subscriptions:
        try:
            print(f"[AZURE] Listing resources for subscription: {sub['display_name']} ({sub['subscription_id']})")
            res_client = ResourceManagementClient(credential, sub["subscription_id"])
            count = 0
            for resource in res_client.resources.list():
                count += 1
                all_resources.append({
                    "id": resource.id,
                    "name": resource.name,
                    "type": resource.type,
                    "location": resource.location,
                    "subscription_id": sub["subscription_id"],
                    "subscription_name": sub["display_name"],
                })
                if count >= MAX_RESOURCES_PER_SUB:
                    print(f"[AZURE] Hit resource cap ({MAX_RESOURCES_PER_SUB}) for subscription {sub['display_name']}")
                    break
            print(f"[AZURE] Found {count} resources in subscription {sub['display_name']}")
        except Exception as e:
            print(f"[AZURE] FAILED to list resources for {sub['subscription_id']}: {type(e).__name__}: {e}")
            logger.warning(f"Failed to list resources for subscription {sub['subscription_id']}: {e}")

    print(f"[AZURE] Total resources found: {len(all_resources)}")
    return all_resources



# Known log categories for resource types where the diagnostic categories API
# may return empty results. These are documented in Azure Monitor docs.
KNOWN_LOG_CATEGORIES: dict[str, list[str]] = {
    "microsoft.app/containerapps": [
        "ContainerAppConsoleLogs",
        "ContainerAppSystemLogs",
    ],
    "microsoft.app/managedenvironments": [
        "ContainerAppConsoleLogs",
        "ContainerAppSystemLogs",
    ],
    "microsoft.web/sites": [
        "AppServiceHTTPLogs",
        "AppServiceConsoleLogs",
        "AppServiceAppLogs",
        "AppServiceAuditLogs",
        "AppServicePlatformLogs",
    ],
    "microsoft.sql/servers/databases": [
        "SQLInsights",
        "AutomaticTuning",
        "QueryStoreRuntimeStatistics",
        "QueryStoreWaitStatistics",
        "Errors",
        "DatabaseWaitStatistics",
        "Timeouts",
        "Blocks",
        "Deadlocks",
    ],
    "microsoft.compute/virtualmachines": [],
    "microsoft.network/networksecuritygroups": [
        "NetworkSecurityGroupEvent",
        "NetworkSecurityGroupRuleCounter",
    ],
    "microsoft.keyvault/vaults": [
        "AuditEvent",
        "AzurePolicyEvaluationDetails",
    ],
    "microsoft.storage/storageaccounts": [
        "StorageRead",
        "StorageWrite",
        "StorageDelete",
    ],
}


def _get_resource_type(resource_uri: str) -> str:
    """Extract the resource type from an ARM resource URI, lowercased."""
    parts = resource_uri.split("/providers/")
    if len(parts) >= 2:
        # Take the last provider segment, e.g. "Microsoft.App/containerApps/myapp"
        provider_path = parts[-1]
        segments = provider_path.split("/")
        # Resource type is provider/type, e.g. "Microsoft.App/containerApps"
        if len(segments) >= 2:
            return f"{segments[0]}/{segments[1]}".lower()
    return ""


def _get_supported_diagnostic_categories(access_token: str, resource_uri: str) -> dict:
    """
    Query the Azure Monitor API to discover which diagnostic log categories
    and metrics the resource supports. Falls back to known categories for
    common resource types when the API returns empty results.
    Returns {'logs': [...], 'metrics': [...]}.
    """
    clean_uri = resource_uri.lstrip("/")
    url = (
        f"https://management.azure.com/{clean_uri}"
        f"/providers/Microsoft.Insights/diagnosticSettingsCategories"
        f"?api-version={DIAGNOSTIC_SETTINGS_API_VERSION}"
    )
    headers = {"Authorization": f"Bearer {access_token}"}

    result = {"logs": [], "metrics": []}

    try:
        resp = httpx.get(url, headers=headers, timeout=15.0)
        print(f"[AZURE] Diagnostic categories query status: {resp.status_code}")

        if resp.status_code == 200:
            categories = resp.json().get("value", [])
            for cat in categories:
                props = cat.get("properties", {})
                cat_type = props.get("categoryType", "")
                cat_name = props.get("categoryName", cat.get("name", ""))

                if cat_type == "Logs":
                    result["logs"].append(cat_name)
                elif cat_type == "Metrics":
                    result["metrics"].append(cat_name)

            print(f"[AZURE] Supported log categories: {result['logs']}")
            print(f"[AZURE] Supported metric categories: {result['metrics']}")
        else:
            print(f"[AZURE] Failed to query categories: {resp.text[:300]}")
    except Exception as e:
        print(f"[AZURE] Exception querying categories: {type(e).__name__}: {e}")

    # Fallback: if no log categories were returned, check known mappings
    if not result["logs"]:
        resource_type = _get_resource_type(resource_uri)
        known = KNOWN_LOG_CATEGORIES.get(resource_type)
        if known:
            print(f"[AZURE] Using known fallback log categories for {resource_type}: {known}")
            result["logs"] = known

    return result



def _find_or_create_log_analytics_workspace(
    access_token: str,
    subscription_id: str,
    resource_group: str,
    location: str,
) -> str | None:
    """
    Find an existing Log Analytics workspace in the subscription, or
    create one named 'pinnacle-siem-workspace' in the given resource group.
    Returns the full workspace resource ID or None on failure.
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # 1. Search for existing workspaces in the subscription
    list_url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/providers/Microsoft.OperationalInsights/workspaces"
        f"?api-version=2023-09-01"
    )

    try:
        resp = httpx.get(list_url, headers=headers, timeout=15.0)
        if resp.status_code == 200:
            workspaces = resp.json().get("value", [])
            if workspaces:
                ws_id = workspaces[0]["id"]
                ws_name = workspaces[0]["name"]
                print(f"[AZURE] Found existing Log Analytics workspace: {ws_name}")
                return ws_id
        print(f"[AZURE] No existing Log Analytics workspace found, creating one...")
    except Exception as e:
        print(f"[AZURE] Error searching for workspaces: {type(e).__name__}: {e}")

    # 2. Create a new workspace
    ws_name = "pinnacle-siem-workspace"
    create_url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}"
        f"/providers/Microsoft.OperationalInsights/workspaces/{ws_name}"
        f"?api-version=2023-09-01"
    )

    payload = {
        "location": location,
        "properties": {
            "sku": {"name": "PerGB2018"},
            "retentionInDays": 30,
        },
    }

    try:
        resp = httpx.put(create_url, headers=headers, json=payload, timeout=60.0)
        print(f"[AZURE] Create workspace response: {resp.status_code}")

        if resp.status_code in (200, 201, 202):
            ws_data = resp.json()
            ws_id = ws_data.get("id")
            print(f"[AZURE] Created Log Analytics workspace: {ws_id}")
            return ws_id
        else:
            print(f"[AZURE] Failed to create workspace: {resp.text[:300]}")
    except Exception as e:
        print(f"[AZURE] Exception creating workspace: {type(e).__name__}: {e}")

    return None


def _extract_resource_group(resource_uri: str) -> str | None:
    """Extract the resource group name from an ARM resource URI."""
    parts = resource_uri.lower().split("/")
    try:
        idx = parts.index("resourcegroups")
        return resource_uri.split("/")[idx + 1]  # Use original case
    except (ValueError, IndexError):
        return None


def _extract_location_from_resource(access_token: str, resource_uri: str) -> str:
    """Get the location of a resource via ARM API."""
    clean_uri = resource_uri.lstrip("/")
    url = f"https://management.azure.com/{clean_uri}?api-version=2023-05-01"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        resp = httpx.get(url, headers=headers, timeout=10.0)
        if resp.status_code == 200:
            return resp.json().get("location", "eastus")
    except Exception:
        pass
    return "centralindia"  # Fallback for student subscriptions


def _resolve_container_app_to_environment(
    access_token: str,
    resource_uri: str,
) -> str | None:
    """
    For Container App resources (Microsoft.App/containerApps), diagnostic log
    categories live on the parent Managed Environment, not the app itself.
    This function fetches the app's managedEnvironmentId so we can deploy
    the diagnostic setting on the correct resource.
    
    Returns the environment resource URI, or None if not a Container App
    or if the lookup fails.
    """
    resource_type = _get_resource_type(resource_uri)
    if resource_type != "microsoft.app/containerapps":
        return None

    clean_uri = resource_uri.lstrip("/")
    url = f"https://management.azure.com/{clean_uri}?api-version=2024-03-01"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        resp = httpx.get(url, headers=headers, timeout=15.0)
        if resp.status_code == 200:
            env_id = resp.json().get("properties", {}).get("managedEnvironmentId")
            if env_id:
                print(f"[AZURE] Container App → redirecting to Managed Environment: {env_id}")
                return env_id
            else:
                print("[AZURE] Container App has no managedEnvironmentId")
        else:
            print(f"[AZURE] Failed to fetch Container App details: {resp.status_code}")
    except Exception as e:
        print(f"[AZURE] Exception fetching Container App: {type(e).__name__}: {e}")

    return None


def deploy_azure_logging(
    access_token: str,
    subscription_id: str,
    resource_uri: str,
    siem_webhook_url: str,
) -> dict:
    """
    Creates an Azure Diagnostic Setting on a specific resource that
    forwards all supported logs to a Log Analytics workspace.

    Dynamically discovers supported log categories for the resource type,
    instead of hardcoding 'allLogs' (which isn't supported by all types).

    For Container Apps: automatically redirects to the parent Managed
    Environment, which is where log categories are defined.

    Args:
        access_token: OAuth token from the cloud_connections table
        subscription_id: Azure subscription ID
        resource_uri: Full ARM resource URI (e.g. /subscriptions/.../resourceGroups/.../providers/...)
        siem_webhook_url: The SIEM ingest endpoint for Azure logs
    """
    setting_name = "Pinnacle-SIEM-Connector"

    # 0. For Container Apps, redirect to the parent Managed Environment
    env_uri = _resolve_container_app_to_environment(access_token, resource_uri)
    target_uri = env_uri or resource_uri

    # 1. Query supported diagnostic categories for this resource
    categories = _get_supported_diagnostic_categories(access_token, target_uri)

    if not categories["logs"] and not categories["metrics"]:
        return {
            "status": "error",
            "detail": (
                "This resource type does not support any diagnostic log categories. "
                "Diagnostic settings cannot be deployed on this resource."
            ),
        }

    # 2. Find or create a Log Analytics workspace as the destination
    resource_group = _extract_resource_group(target_uri)
    if not resource_group:
        return {
            "status": "error",
            "detail": "Could not determine the resource group from the resource URI.",
        }

    location = _extract_location_from_resource(access_token, target_uri)

    workspace_id = _find_or_create_log_analytics_workspace(
        access_token, subscription_id, resource_group, location,
    )

    if not workspace_id:
        return {
            "status": "error",
            "detail": (
                "Could not find or create a Log Analytics workspace. "
                "Please ensure the subscription has the Microsoft.OperationalInsights "
                "resource provider registered."
            ),
        }

    # 3. Build the diagnostic setting payload with actual supported categories
    log_entries = [
        {"category": cat, "enabled": True}
        for cat in categories["logs"]
    ]

    metric_entries = [
        {"category": cat, "enabled": True}
        for cat in categories["metrics"]
    ]

    # Ensure target_uri doesn't have a leading slash for URL construction
    clean_uri = target_uri.lstrip("/")

    url = (
        f"https://management.azure.com/{clean_uri}"
        f"/providers/Microsoft.Insights/diagnosticSettings/{setting_name}"
        f"?api-version={DIAGNOSTIC_SETTINGS_API_VERSION}"
    )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "properties": {
            "workspaceId": workspace_id,
            "logs": log_entries,
            "metrics": metric_entries,
        }
    }

    try:
        print(f"[AZURE] Deploying diagnostic setting '{setting_name}' on {target_uri}")
        if env_uri:
            print(f"[AZURE] (Redirected from Container App: {resource_uri})")
        print(f"[AZURE] Using workspace: {workspace_id}")
        print(f"[AZURE] Log categories: {categories['logs']}")
        print(f"[AZURE] PUT {url}")

        resp = httpx.put(url, headers=headers, json=payload, timeout=30.0)

        print(f"[AZURE] Response status: {resp.status_code}")

        if resp.status_code in (200, 201):
            result_data = resp.json()
            logger.info(f"Deployed Azure diagnostic setting on {target_uri}")
            return {
                "status": "success",
                "setting_name": result_data.get("name", setting_name),
                "workspace_id": workspace_id,
                "log_categories": categories["logs"],
                "target_resource": target_uri,
            }
        else:
            error_body = resp.text[:500]
            print(f"[AZURE] Diagnostic setting deployment failed: {error_body}")
            logger.error(
                f"Failed to deploy Azure diagnostic setting: "
                f"HTTP {resp.status_code} - {error_body}"
            )
            return {
                "status": "error",
                "detail": f"Azure API returned {resp.status_code}: {error_body}",
            }
    except Exception as e:
        logger.error(f"Failed to deploy Azure diagnostic setting: {e}")
        return {"status": "error", "detail": str(e)}


def sync_logs_from_workspace(
    access_token: str,
    workspace_id: str,
    source_id: int,
    source_name: str,
    timespan: str = "PT30M",
) -> list[dict]:
    """
    Query Azure Log Analytics workspace for recent Container App logs
    and return them in the Pinnacle SIEM normalized format.

    Args:
        access_token: OAuth token
        workspace_id: Full ARM resource ID of the Log Analytics workspace
        source_id: The log source ID in Pinnacle SIEM
        source_name: The log source name
        timespan: ISO 8601 duration (default: last 30 minutes)
    """
    # Extract the workspace GUID (customerId) from the workspace resource
    headers = {"Authorization": f"Bearer {access_token}"}
    clean_ws = workspace_id.lstrip("/")
    ws_url = f"https://management.azure.com/{clean_ws}?api-version=2023-09-01"

    workspace_guid = None
    try:
        resp = httpx.get(ws_url, headers=headers, timeout=10.0)
        if resp.status_code == 200:
            workspace_guid = resp.json().get("properties", {}).get("customerId")
            print(f"[AZURE] Log Analytics workspace GUID: {workspace_guid}")
    except Exception as e:
        print(f"[AZURE] Failed to get workspace GUID: {e}")

    if not workspace_guid:
        print("[AZURE] Cannot sync logs: workspace GUID not found")
        return []

    # Query Log Analytics API for container logs
    query_url = f"https://api.loganalytics.io/v1/workspaces/{workspace_guid}/query"
    query_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Query for console logs (simpler query for ARM proxy compatibility)
    kql = "ContainerAppConsoleLogs_CL | order by TimeGenerated desc | take 200"

    normalized_logs = []

    try:
        # Log Analytics API needs a different token scope
        # Use the management token to get data via the ARM proxy instead
        arm_query_url = (
            f"https://management.azure.com/{clean_ws}"
            f"/api/query?api-version=2020-08-01"
        )

        resp = httpx.post(
            arm_query_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={"query": kql, "timespan": timespan},
            timeout=30.0,
        )

        print(f"[AZURE] Log Analytics query status: {resp.status_code}")

        if resp.status_code == 200:
            data = resp.json()
            print(f"[AZURE] Response keys: {list(data.keys())}")
            # ARM proxy uses PascalCase: Tables, Columns, Rows
            tables = data.get("Tables", data.get("tables", []))
            if not tables:
                print(f"[AZURE] No tables in response. Preview: {str(data)[:500]}")
            if tables:
                # Column names can be under "ColumnName" or "name"
                raw_cols = tables[0].get("Columns", tables[0].get("columns", []))
                columns = [col.get("ColumnName", col.get("name", "")) for col in raw_cols]
                rows = tables[0].get("Rows", tables[0].get("rows", []))
                print(f"[AZURE] Got {len(rows)} log entries from Log Analytics")
                print(f"[AZURE] Columns: {columns[:5]}...")

                for row in rows:
                    entry = dict(zip(columns, row))
                    log_text = entry.get("Log_s", "")
                    container_name = entry.get("ContainerAppName_s", entry.get("ContainerName_s", "unknown"))

                    normalized_logs.append({
                        "timestamp": entry.get("TimeGenerated", datetime.now(timezone.utc).isoformat()),
                        "source_ip": "azure-container-app",
                        "cloud_provider": "azure",
                        "source_id": source_id,
                        "source_name": source_name,
                        "action": log_text[:500] if log_text else "unknown",
                        "status": "info",
                        "raw_log": entry,
                    })
            else:
                print("[AZURE] No tables returned from query")
        else:
            print(f"[AZURE] Log Analytics query failed: {resp.text[:300]}")
    except Exception as e:
        print(f"[AZURE] Exception querying Log Analytics: {type(e).__name__}: {e}")

    return normalized_logs
