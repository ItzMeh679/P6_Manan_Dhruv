"""
AI Alerts — Elasticsearch Operations

Manages the `ai-alerts-*` index pattern for storing and querying
AI-generated security insights from Gemini analysis.
"""
import logging
from datetime import datetime

from .elasticsearch import get_es_client

logger = logging.getLogger(__name__)


def _get_today_alert_index() -> str:
    """Get the index name for today's AI alerts."""
    return f"ai-alerts-{datetime.utcnow().strftime('%Y-%m-%d')}"


async def ensure_ai_alerts_template():
    """Create an index template for the ai-alerts-* pattern if it doesn't exist."""
    es = get_es_client()
    template_name = "ai-alerts-template"

    try:
        exists = await es.indices.exists_index_template(name=template_name)
        if not exists:
            await es.indices.put_index_template(
                name=template_name,
                body={
                    "index_patterns": ["ai-alerts-*"],
                    "template": {
                        "settings": {
                            "number_of_shards": 1,
                            "number_of_replicas": 0,
                        },
                        "mappings": {
                            "properties": {
                                "timestamp": {"type": "date"},
                                "severity": {"type": "keyword"},       # critical, high, medium, low, info
                                "category": {"type": "keyword"},       # security, performance, infrastructure, etc.
                                "title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                                "description": {"type": "text"},
                                "affected_resources": {"type": "text"},
                                "recommended_action": {"type": "text"},
                                "dismissed": {"type": "boolean"},
                                "source_log_count": {"type": "integer"},  # How many logs were analyzed
                                "analysis_id": {"type": "keyword"},       # Groups alerts from same analysis run
                            }
                        },
                    },
                },
            )
            logger.info("Created Elasticsearch index template: %s", template_name)
    except Exception as e:
        logger.error("Failed to create AI alerts index template: %s", e)


async def index_ai_alert(alert: dict) -> bool:
    """Index a single AI alert document."""
    es = get_es_client()
    index_name = _get_today_alert_index()

    try:
        doc_id = alert.pop("_doc_id", None)
        if doc_id:
            # Use create to avoid duplicates (409 if exists)
            try:
                await es.index(index=index_name, id=doc_id, document=alert, op_type="create")
            except Exception as conflict_err:
                if "conflict" in str(conflict_err).lower() or "409" in str(conflict_err):
                    return False  # Already exists — dedup
                raise
        else:
            await es.index(index=index_name, document=alert)
        return True
    except Exception as e:
        logger.error("Failed to index AI alert: %s", e)
        return False


async def search_ai_alerts(
    severity: str | None = None,
    category: str | None = None,
    dismissed: bool | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    size: int = 50,
) -> dict:
    """Search AI alerts with optional filters."""
    es = get_es_client()
    filters = []

    if severity:
        filters.append({"term": {"severity": severity}})
    if category:
        filters.append({"term": {"category": category}})
    if dismissed is not None:
        filters.append({"term": {"dismissed": dismissed}})

    date_range = {}
    if start_date:
        date_range["gte"] = start_date
    if end_date:
        date_range["lte"] = end_date
    if date_range:
        filters.append({"range": {"timestamp": date_range}})

    body = {
        "query": {
            "bool": {
                "must": [{"match_all": {}}],
                "filter": filters,
            }
        },
        "sort": [{"timestamp": {"order": "desc"}}],
        "from": (page - 1) * size,
        "size": size,
    }

    try:
        response = await es.search(index="ai-alerts-*", body=body)
        hits = response.get("hits", {})
        total = hits.get("total", {}).get("value", 0)
        alerts = []
        for hit in hits.get("hits", []):
            alert = hit["_source"]
            alert["_id"] = hit["_id"]
            alert["_index"] = hit["_index"]
            alerts.append(alert)
        return {"total": total, "page": page, "size": size, "alerts": alerts}
    except Exception as e:
        logger.error("AI alerts search failed: %s", e)
        return {"total": 0, "page": page, "size": size, "alerts": []}


async def get_alert_stats() -> dict:
    """Get aggregate statistics for AI alerts."""
    es = get_es_client()
    try:
        response = await es.search(
            index="ai-alerts-*",
            body={
                "size": 0,
                "query": {
                    "bool": {
                        "must_not": [{"term": {"dismissed": True}}]
                    }
                },
                "aggs": {
                    "by_severity": {
                        "terms": {"field": "severity", "size": 10}
                    },
                    "by_category": {
                        "terms": {"field": "category", "size": 20}
                    },
                    "recent_24h": {
                        "filter": {"range": {"timestamp": {"gte": "now-24h"}}}
                    },
                },
            },
        )

        hits = response.get("hits", {})
        total = hits.get("total", {}).get("value", 0)

        severity_buckets = response.get("aggregations", {}).get("by_severity", {}).get("buckets", [])
        by_severity = {b["key"]: b["doc_count"] for b in severity_buckets}

        category_buckets = response.get("aggregations", {}).get("by_category", {}).get("buckets", [])
        by_category = {b["key"]: b["doc_count"] for b in category_buckets}

        recent_24h = response.get("aggregations", {}).get("recent_24h", {}).get("doc_count", 0)

        return {
            "total_active": total,
            "by_severity": by_severity,
            "by_category": by_category,
            "last_24h": recent_24h,
        }
    except Exception as e:
        logger.error("AI alert stats query failed: %s", e)
        return {"total_active": 0, "by_severity": {}, "by_category": {}, "last_24h": 0}


async def dismiss_alert(index: str, alert_id: str) -> bool:
    """Mark an alert as dismissed."""
    es = get_es_client()
    try:
        await es.update(index=index, id=alert_id, body={"doc": {"dismissed": True}})
        return True
    except Exception as e:
        logger.error("Failed to dismiss alert %s: %s", alert_id, e)
        return False
