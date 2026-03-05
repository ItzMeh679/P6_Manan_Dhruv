#!/usr/bin/env python3
"""
SIEM Log Generator — Sends realistic fake logs to the Pinnacle SIEM backend.

Supports all 3 cloud providers: AWS (Nginx lines), Azure (Diagnostic JSON), GCP (Pub/Sub).
Runs in a loop or single-shot mode (--once).

Usage:
  # Local testing
  python generate_logs.py --url http://localhost/api/py --api-key siem_ingest_key_change_me_in_production --once

  # Continuous (for Azure Container Instance)
  python generate_logs.py --url https://<ngrok-url>/api/py --api-key <key> --interval 8
"""

import argparse
import json
import random
import time
import base64
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta


# ─── Realistic Data Pools ────────────────────────────────────────────────────

SAMPLE_IPS = [
    "10.0.1.45", "172.16.0.12", "192.168.1.100", "10.0.2.88",
    "203.0.113.50", "198.51.100.23", "172.31.0.7", "10.10.5.201",
    "192.168.10.55", "10.0.0.1", "34.120.50.12", "52.183.90.44",
    "13.107.42.14", "104.18.22.33", "185.199.108.153",
]

HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
HTTP_PATHS = [
    "/", "/api/users", "/api/auth/login", "/api/products", "/health",
    "/api/orders", "/api/v2/search", "/dashboard", "/api/logs",
    "/api/settings", "/static/app.js", "/static/style.css",
    "/api/notifications", "/api/analytics", "/favicon.ico",
]
HTTP_STATUSES = ["200", "200", "200", "201", "301", "304", "400", "401", "403", "404", "500", "502"]

AZURE_OPERATIONS = [
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Compute/virtualMachines/deallocate/action",
    "Microsoft.Storage/storageAccounts/listKeys/action",
    "Microsoft.Network/networkSecurityGroups/write",
    "Microsoft.Web/sites/restart/action",
    "Microsoft.Sql/servers/databases/read",
    "Microsoft.Authorization/roleAssignments/write",
    "Microsoft.KeyVault/vaults/secrets/read",
    "Microsoft.ContainerRegistry/registries/push/write",
    "Microsoft.Resources/deployments/write",
]
AZURE_RESULT_TYPES = ["Success", "Success", "Success", "Failed", "Conflict", "Forbidden"]

GCP_METHODS = [
    "storage.objects.get", "storage.objects.create", "storage.buckets.list",
    "compute.instances.start", "compute.instances.stop",
    "iam.serviceAccounts.actAs", "bigquery.jobs.create",
    "pubsub.topics.publish", "run.services.create",
    "cloudfunctions.functions.call",
]
GCP_STATUSES = ["OK", "OK", "OK", "PERMISSION_DENIED", "NOT_FOUND", "ALREADY_EXISTS"]


# ─── Log Generators ──────────────────────────────────────────────────────────

def generate_aws_logs(count: int = 5) -> list[str]:
    """Generate Nginx-style access log lines."""
    logs = []
    for _ in range(count):
        ip = random.choice(SAMPLE_IPS)
        method = random.choice(HTTP_METHODS)
        path = random.choice(HTTP_PATHS)
        status = random.choice(HTTP_STATUSES)
        size = random.randint(128, 65536)
        ts = datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, 300))
        ts_str = ts.strftime("%d/%b/%Y:%H:%M:%S +0000")
        line = f'{ip} - - [{ts_str}] "{method} {path} HTTP/1.1" {status} {size}'
        logs.append(line)
    return logs


def generate_azure_records(count: int = 5) -> list[dict]:
    """Generate Azure Diagnostic Settings JSON records."""
    records = []
    for _ in range(count):
        ts = datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, 300))
        record = {
            "time": ts.isoformat(),
            "callerIpAddress": random.choice(SAMPLE_IPS),
            "operationName": random.choice(AZURE_OPERATIONS),
            "resultType": random.choice(AZURE_RESULT_TYPES),
            "category": "Administrative",
            "correlationId": f"{random.randint(10000000, 99999999)}-{random.randint(1000, 9999)}",
            "level": random.choice(["Information", "Warning", "Error"]),
            "resourceId": f"/subscriptions/sub-{random.randint(1000,9999)}/resourceGroups/rg-demo",
        }
        records.append(record)
    return records


def generate_gcp_message() -> dict:
    """Generate a GCP Pub/Sub message with base64-encoded log payload."""
    ts = datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, 300))
    payload = {
        "timestamp": ts.isoformat(),
        "protoPayload": {
            "methodName": random.choice(GCP_METHODS),
            "status": random.choice(GCP_STATUSES),  # String, not dict — avoids ES mapping conflict
            "requestMetadata": {
                "callerIp": random.choice(SAMPLE_IPS),
            },
            "serviceName": "storage.googleapis.com",
        },
        "resource": {
            "type": "gcs_bucket",
            "labels": {"bucket_name": f"demo-bucket-{random.randint(1, 100)}"},
        },
    }
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    return {"data": encoded}


# ─── Sender ───────────────────────────────────────────────────────────────────

def send_logs(base_url: str, api_key: str, endpoint: str, payload: dict) -> bool:
    """POST logs to the SIEM backend. Returns True on success."""
    url = f"{base_url.rstrip('/')}/ingest/{endpoint}"
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Ingest-Api-Key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode())
            print(f"  ✅ [{endpoint.upper():>5}] {resp.status} — {body}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else ""
        print(f"  ❌ [{endpoint.upper():>5}] HTTP {e.code} — {err_body}")
        return False
    except Exception as e:
        print(f"  ❌ [{endpoint.upper():>5}] Error: {e}")
        return False


def send_batch(base_url: str, api_key: str, count: int):
    """Generate and send one batch of logs for all 3 providers."""
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"\n🔄 [{ts}] Sending batch of {count} logs per provider...")

    # AWS
    aws_logs = generate_aws_logs(count)
    send_logs(base_url, api_key, "aws", {"logs": aws_logs})

    # Azure
    azure_records = generate_azure_records(count)
    send_logs(base_url, api_key, "azure", {"records": azure_records})

    # GCP (one message per call, send `count` times)
    for _ in range(count):
        gcp_msg = generate_gcp_message()
        send_logs(base_url, api_key, "gcp", {"message": gcp_msg})


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    import os

    parser = argparse.ArgumentParser(description="SIEM Log Generator")
    parser.add_argument(
        "--url",
        default=os.getenv("SIEM_URL", "http://localhost/api/py"),
        help="Base URL of the SIEM backend (default: $SIEM_URL or http://localhost/api/py)",
    )
    parser.add_argument(
        "--api-key",
        default=os.getenv("INGEST_API_KEY", "siem_ingest_key_change_me_in_production"),
        help="Ingest API key (default: $INGEST_API_KEY)",
    )
    parser.add_argument(
        "--count", type=int, default=5,
        help="Number of logs per provider per batch (default: 5)",
    )
    parser.add_argument(
        "--interval", type=int, default=8,
        help="Seconds between batches in loop mode (default: 8)",
    )
    parser.add_argument(
        "--once", action="store_true",
        help="Send one batch and exit (instead of looping)",
    )
    args = parser.parse_args()

    print("=" * 55)
    print("  Pinnacle SIEM — Log Generator")
    print("=" * 55)
    print(f"  Target : {args.url}")
    print(f"  API Key: {args.api_key[:8]}...{args.api_key[-4:]}")
    print(f"  Batch  : {args.count} logs/provider")
    print(f"  Mode   : {'Single shot' if args.once else f'Loop every {args.interval}s'}")
    print("=" * 55)

    if args.once:
        send_batch(args.url, args.api_key, args.count)
        print("\n✨ Done!")
    else:
        try:
            while True:
                send_batch(args.url, args.api_key, args.count)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n\n🛑 Stopped by user.")


if __name__ == "__main__":
    main()
