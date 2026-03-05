import re
import json
import base64
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# Regex for common Nginx/Apache combined log format:
# 192.168.1.1 - - [10/Oct/2023:13:55:36 +0000] "GET / HTTP/1.1" 200 612
NGINX_LOG_PATTERN = re.compile(
    r'(?P<ip>[\d.]+)\s+-\s+-\s+\[(?P<timestamp>[^\]]+)\]\s+'
    r'"(?P<method>\S+)\s+(?P<path>\S+)\s+\S+"\s+(?P<status>\d+)'
)


def normalize_aws_log(raw_line: str) -> Optional[dict]:
    """Parse a raw Nginx/syslog line into the unified schema."""
    match = NGINX_LOG_PATTERN.match(raw_line.strip())
    if not match:
        # Fallback: store as-is with unknown fields
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ip": "unknown",
            "cloud_provider": "aws",
            "action": raw_line.strip()[:200],
            "status": "unknown",
            "raw_log": {"raw": raw_line},
        }

    try:
        # Parse Nginx timestamp: 10/Oct/2023:13:55:36
        ts_str = match.group("timestamp").split(" ")[0]  # strip timezone offset if present
        ts = datetime.strptime(ts_str, "%d/%b/%Y:%H:%M:%S")
        ts = ts.replace(tzinfo=timezone.utc)
    except (ValueError, IndexError):
        ts = datetime.now(timezone.utc)

    return {
        "timestamp": ts.isoformat(),
        "source_ip": match.group("ip"),
        "cloud_provider": "aws",
        "action": f"{match.group('method')} {match.group('path')}",
        "status": match.group("status"),
        "raw_log": {"raw": raw_line},
    }


def normalize_azure_log(record: dict) -> dict:
    """Normalize an Azure Diagnostic Settings JSON record."""
    return {
        "timestamp": record.get("time", datetime.now(timezone.utc).isoformat()),
        "source_ip": record.get("callerIpAddress", record.get("callerIPAddress", "unknown")),
        "cloud_provider": "azure",
        "action": record.get("operationName", record.get("action", "unknown")),
        "status": record.get("resultType", record.get("status", "unknown")),
        "raw_log": record,
    }


def normalize_gcp_log(message: dict) -> dict:
    """Normalize a GCP Cloud Logging Pub/Sub message.
    
    GCP sends base64-encoded JSON in message.data.
    """
    try:
        # Decode the base64 Pub/Sub message
        raw_data = message.get("data", "")
        if raw_data:
            decoded = base64.b64decode(raw_data).decode("utf-8")
            payload = json.loads(decoded)
        else:
            payload = message
    except Exception:
        payload = message

    # Extract from protoPayload structure
    proto = payload.get("protoPayload", payload)
    request_meta = proto.get("requestMetadata", {})

    return {
        "timestamp": payload.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "source_ip": request_meta.get("callerIp", "unknown"),
        "cloud_provider": "gcp",
        "action": proto.get("methodName", "unknown"),
        "status": proto.get("status", {}).get("message", "unknown") if isinstance(proto.get("status"), dict) else str(proto.get("status", "unknown")),
        "raw_log": payload,
    }


def normalize_log(raw_data, cloud_provider: str) -> list[dict]:
    """Main entry point: normalize logs based on cloud provider.
    
    Returns a list of normalized log dicts ready for Elasticsearch.
    """
    normalized = []

    if cloud_provider == "aws":
        # raw_data is a list of log lines
        if isinstance(raw_data, list):
            for line in raw_data:
                result = normalize_aws_log(str(line))
                if result:
                    normalized.append(result)
        else:
            result = normalize_aws_log(str(raw_data))
            if result:
                normalized.append(result)

    elif cloud_provider == "azure":
        # raw_data is a list of record dicts
        if isinstance(raw_data, list):
            for record in raw_data:
                normalized.append(normalize_azure_log(record))
        else:
            normalized.append(normalize_azure_log(raw_data))

    elif cloud_provider == "gcp":
        # raw_data is a single message dict
        normalized.append(normalize_gcp_log(raw_data))

    return normalized
