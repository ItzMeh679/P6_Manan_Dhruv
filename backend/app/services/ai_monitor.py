"""
AI Log Monitor — Background Service

Every 60 seconds, fetches recent logs from Elasticsearch and sends them
to Google Gemini for security/infrastructure analysis. Detected issues
are stored as structured alerts in the `ai-alerts-*` index.
"""
import asyncio
import hashlib
import json
import logging
import os
import uuid
from datetime import datetime, timezone

import httpx

from .elasticsearch import get_es_client
from .ai_alerts import index_ai_alert
from .email_notifier import send_alert_email

logger = logging.getLogger(__name__)

# How often to run analysis (in seconds)
ANALYSIS_INTERVAL = 60

# Max logs to send per analysis batch
MAX_LOGS_PER_BATCH = 200

# Background task handle
_monitor_task: asyncio.Task | None = None

# Track last analysis time and status
_last_analysis: dict = {"timestamp": None, "status": "idle", "logs_analyzed": 0, "alerts_generated": 0}


# ─── System Prompt ──────────────────────────────────────────────
SYSTEM_PROMPT = """You are a senior Site Reliability Engineer (SRE) and Security Operations Center (SOC) analyst.
You are monitoring real-time deployment logs from a multi-cloud SIEM (Security Information and Event Management) platform.

Your job is to analyze the provided logs and identify any issues that need attention. Be thorough but avoid false positives.

## Categories to Monitor

1. **Security Breaches**: Brute force attacks, unauthorized access attempts, privilege escalation, SQL injection, XSS attempts, suspicious IP patterns, credential stuffing, directory traversal, command injection, CSRF attacks, token theft indicators.

2. **Website/Service Failures**: HTTP 5xx error spikes, service unavailable (503), connection timeouts, SSL/TLS certificate errors, DNS resolution failures, reverse proxy errors, gateway timeouts (504), malformed responses.

3. **Performance Anomalies**: Sudden latency spikes, abnormal request rates (traffic surges or drops), memory exhaustion indicators, CPU throttling signs, disk I/O bottlenecks, connection pool exhaustion, slow database queries, high error-to-success ratios.

4. **Authentication Issues**: Mass failed login attempts, token expiration storms, OAuth flow failures, session fixation/hijacking indicators, MFA bypass attempts, account lockout surges, invalid API key usage.

5. **Infrastructure Problems**: Container/pod restart loops (CrashLoopBackOff), health check failures, load balancer 502/503 errors, database connection drops, message queue backlogs, storage quota warnings, network partition indicators.

6. **Data Integrity**: Unusual data transfer volumes (exfiltration indicators), unexpected bulk operations, database write errors, replication lag warnings, data corruption signals, backup failures.

7. **Compliance Violations**: Access to sensitive endpoints without proper authorization, audit log gaps or tampering, PII/PHI exposure in log messages, unencrypted data transfers, regulatory endpoint violations.

8. **Deployment Issues**: Rolling deployment failures, configuration drift, version mismatches between services, failed database migrations, canary deployment anomalies, rollback indicators.

## Response Format

You MUST respond with a valid JSON array. Each element represents one detected issue:

```json
[
  {
    "severity": "critical|high|medium|low|info",
    "category": "security|website_failure|performance|authentication|infrastructure|data_integrity|compliance|deployment",
    "title": "Brief descriptive title (max 100 chars)",
    "description": "Detailed explanation of what was detected and why it matters (2-4 sentences)",
    "affected_resources": "Comma-separated list of affected IPs, services, or endpoints",
    "recommended_action": "Specific actionable steps to investigate or mitigate (1-3 sentences)"
  }
]
```

## Rules
- If NO issues are detected, respond with an empty array: `[]`
- Do NOT fabricate issues. Only report what you can clearly identify from the logs.
- Prioritize severity correctly: critical = immediate action needed, high = urgent, medium = should investigate soon, low = monitor, info = informational pattern.
- Group related log entries into a single alert rather than creating separate alerts for each log line.
- Be specific about which IPs, endpoints, or services are affected.
- Consider the context: a few 404s are normal, but hundreds from one IP might indicate scanning."""


def _build_log_summary(logs: list[dict]) -> str:
    """Build a compact text summary of logs for Gemini analysis."""
    lines = []
    for log in logs:
        ts = log.get("timestamp", "?")
        ip = log.get("source_ip", "?")
        provider = log.get("cloud_provider", "?")
        source = log.get("source_name", "?")
        action = log.get("action", "?")
        status = log.get("status", "?")
        lines.append(f"[{ts}] {provider}/{source} | {ip} | {action} | status={status}")
    return "\n".join(lines)


def _make_alert_id(alert: dict, analysis_id: str) -> str:
    """Generate a deterministic ID for deduplication."""
    key = f"{analysis_id}|{alert.get('title', '')}|{alert.get('category', '')}"
    return hashlib.sha256(key.encode()).hexdigest()[:24]


async def _fetch_recent_logs(seconds: int = 60) -> list[dict]:
    """Fetch logs from the last N seconds from Elasticsearch."""
    es = get_es_client()
    try:
        response = await es.search(
            index="logs-*",
            body={
                "query": {
                    "range": {
                        "timestamp": {"gte": f"now-{seconds}s"}
                    }
                },
                "sort": [{"timestamp": {"order": "desc"}}],
                "size": MAX_LOGS_PER_BATCH,
            },
        )
        hits = response.get("hits", {}).get("hits", [])
        return [hit["_source"] for hit in hits]
    except Exception as e:
        logger.error("[AI] Failed to fetch recent logs: %s", e)
        return []


async def _call_gemini(log_text: str, log_count: int) -> list[dict]:
    """Send logs to Gemini API and parse the structured response."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("[AI] GEMINI_API_KEY not set — skipping analysis")
        return []

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    user_prompt = f"""Analyze the following {log_count} deployment logs collected in the last 60 seconds.
Identify any security issues, failures, anomalies, or concerns.

--- BEGIN LOGS ---
{log_text}
--- END LOGS ---

Respond ONLY with a valid JSON array as specified in your instructions. No markdown, no code fences, just the raw JSON array."""

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": [
            {
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if resp.status_code != 200:
            logger.error("[AI] Gemini API error %d: %s", resp.status_code, resp.text[:500])
            return []

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            logger.warning("[AI] No candidates in Gemini response")
            return []

        # Extract text from the response
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return []

        text = parts[0].get("text", "").strip()

        # Strip markdown fences if present (just in case)
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Parse JSON
        alerts = json.loads(text)
        if not isinstance(alerts, list):
            logger.warning("[AI] Gemini response is not a list: %s", type(alerts))
            return []

        return alerts

    except json.JSONDecodeError as e:
        logger.error("[AI] Failed to parse Gemini JSON: %s — raw: %s", e, text[:300] if 'text' in dir() else "N/A")
        return []
    except httpx.TimeoutException:
        logger.error("[AI] Gemini API request timed out")
        return []
    except Exception as e:
        logger.error("[AI] Gemini API call failed: %s", e)
        return []


async def _run_analysis():
    """Execute a single analysis cycle."""
    global _last_analysis

    _last_analysis["status"] = "running"

    # 1. Fetch recent logs
    logs = await _fetch_recent_logs(seconds=ANALYSIS_INTERVAL)

    if not logs:
        _last_analysis.update({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "idle",
            "logs_analyzed": 0,
            "alerts_generated": 0,
        })
        return

    # 2. Build text summary
    log_text = _build_log_summary(logs)

    # 3. Call Gemini
    raw_alerts = await _call_gemini(log_text, len(logs))

    # 4. Index alerts
    analysis_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    indexed_count = 0
    indexed_alerts = []

    valid_severities = {"critical", "high", "medium", "low", "info"}
    valid_categories = {
        "security", "website_failure", "performance", "authentication",
        "infrastructure", "data_integrity", "compliance", "deployment",
    }

    for raw_alert in raw_alerts:
        # Validate and sanitize
        severity = raw_alert.get("severity", "info").lower()
        if severity not in valid_severities:
            severity = "info"

        category = raw_alert.get("category", "infrastructure").lower()
        if category not in valid_categories:
            category = "infrastructure"

        alert_doc = {
            "timestamp": now,
            "severity": severity,
            "category": category,
            "title": str(raw_alert.get("title", "Untitled Alert"))[:200],
            "description": str(raw_alert.get("description", ""))[:1000],
            "affected_resources": str(raw_alert.get("affected_resources", ""))[:500],
            "recommended_action": str(raw_alert.get("recommended_action", ""))[:500],
            "dismissed": False,
            "source_log_count": len(logs),
            "analysis_id": analysis_id,
            "_doc_id": _make_alert_id(raw_alert, analysis_id),
        }

        if await index_ai_alert(alert_doc):
            indexed_count += 1
            indexed_alerts.append(alert_doc)

    _last_analysis.update({
        "timestamp": now,
        "status": "completed",
        "logs_analyzed": len(logs),
        "alerts_generated": indexed_count,
    })

    if indexed_count > 0:
        logger.info(
            "[AI] Analysis complete: %d logs → %d alerts (analysis_id=%s)",
            len(logs), indexed_count, analysis_id,
        )

        # Send email notification for critical/high alerts
        try:
            await send_alert_email(indexed_alerts, analysis_id, len(logs))
        except Exception as e:
            logger.error("[AI] Email notification failed: %s", e)


async def _monitor_loop():
    """Main background loop — runs analysis every ANALYSIS_INTERVAL seconds."""
    logger.info("[AI] AI log monitor started (interval=%ds)", ANALYSIS_INTERVAL)

    # Wait a bit on startup to let logs accumulate
    await asyncio.sleep(10)

    while True:
        try:
            await _run_analysis()
        except Exception as e:
            logger.error("[AI] Monitor loop error: %s", e)
            _last_analysis["status"] = "error"

        await asyncio.sleep(ANALYSIS_INTERVAL)


def start_ai_monitor():
    """Start the AI monitoring background task. Call during app startup."""
    global _monitor_task
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("[AI] GEMINI_API_KEY not set — AI monitor will NOT start")
        return

    if _monitor_task is None or _monitor_task.done():
        _monitor_task = asyncio.create_task(_monitor_loop())
        logger.info("[AI] AI monitor background task created")


async def stop_ai_monitor():
    """Cancel the AI monitoring background task. Call during app shutdown."""
    global _monitor_task
    if _monitor_task and not _monitor_task.done():
        _monitor_task.cancel()
        try:
            await _monitor_task
        except asyncio.CancelledError:
            pass
        logger.info("[AI] AI monitor background task stopped")
    _monitor_task = None


def get_monitor_status() -> dict:
    """Get the current status of the AI monitor."""
    return {
        "active": _monitor_task is not None and not _monitor_task.done() if _monitor_task else False,
        "interval_seconds": ANALYSIS_INTERVAL,
        "api_key_configured": bool(os.getenv("GEMINI_API_KEY", "")),
        **_last_analysis,
    }
