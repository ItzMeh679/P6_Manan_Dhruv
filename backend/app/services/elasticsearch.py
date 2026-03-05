import os
import logging
from datetime import datetime
from elasticsearch import AsyncElasticsearch

logger = logging.getLogger(__name__)

# Singleton ES client
_es_client: AsyncElasticsearch | None = None


def get_es_client() -> AsyncElasticsearch:
    """Get or create the Elasticsearch async client."""
    global _es_client
    if _es_client is None:
        es_url = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
        _es_client = AsyncElasticsearch(hosts=[es_url])
    return _es_client


async def close_es_client():
    """Close the Elasticsearch client on shutdown."""
    global _es_client
    if _es_client:
        await _es_client.close()
        _es_client = None


def get_today_index() -> str:
    """Get the index name for today (time-series pattern)."""
    return f"logs-{datetime.utcnow().strftime('%Y-%m-%d')}"


async def ensure_index_template():
    """Create an index template for the logs-* pattern if it doesn't exist."""
    es = get_es_client()
    template_name = "logs-template"

    try:
        exists = await es.indices.exists_index_template(name=template_name)
        if not exists:
            await es.indices.put_index_template(
                name=template_name,
                body={
                    "index_patterns": ["logs-*"],
                    "template": {
                        "settings": {
                            "number_of_shards": 1,
                            "number_of_replicas": 0  # Single node dev
                        },
                        "mappings": {
                            "properties": {
                                "timestamp": {"type": "date"},
                                "source_ip": {"type": "keyword"},
                                "cloud_provider": {"type": "keyword"},
                                "source_id": {"type": "integer"},
                                "source_name": {"type": "keyword"},
                                "action": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                                "status": {"type": "keyword"},
                                "raw_log": {"type": "object", "enabled": False}
                            }
                        }
                    }
                }
            )
            logger.info("Created Elasticsearch index template: %s", template_name)
    except Exception as e:
        logger.error("Failed to create ES index template: %s", e)


async def index_log(log_data: dict) -> bool:
    """Index a single normalized log document into today's index."""
    es = get_es_client()
    try:
        await es.index(index=get_today_index(), document=log_data)
        return True
    except Exception as e:
        logger.error("Failed to index log: %s", e)
        return False


async def index_logs_bulk(logs: list[dict]) -> int:
    """Bulk index multiple log documents. Returns count of successfully indexed."""
    if not logs:
        return 0

    es = get_es_client()
    index_name = get_today_index()

    # Use individual index calls for reliability
    success_count = 0
    for log in logs:
        try:
            await es.index(index=index_name, document=log)
            success_count += 1
        except Exception as e:
            logger.error("Failed to index individual log: %s", e)

    return success_count


async def search_logs(
    q: str | None = None,
    cloud_provider: str | None = None,
    source_id: int | None = None,
    source_ids: list[int] | None = None,
    source_ip: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    size: int = 50,
) -> dict:
    """Search logs across all indices with filters."""
    es = get_es_client()
    must = []
    filters = []

    if q:
        must.append({"multi_match": {"query": q, "fields": ["action", "source_ip", "status", "cloud_provider", "source_name"]}})

    if cloud_provider:
        filters.append({"term": {"cloud_provider": cloud_provider}})

    if source_id:
        filters.append({"term": {"source_id": source_id}})

    if source_ids:
        filters.append({"terms": {"source_id": source_ids}})

    if source_ip:
        filters.append({"term": {"source_ip": source_ip}})

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
                "must": must if must else [{"match_all": {}}],
                "filter": filters
            }
        },
        "sort": [{"timestamp": {"order": "desc"}}],
        "from": (page - 1) * size,
        "size": size,
    }

    try:
        response = await es.search(index="logs-*", body=body)
        hits = response.get("hits", {})
        total = hits.get("total", {}).get("value", 0)
        logs = [hit["_source"] for hit in hits.get("hits", [])]
        return {"total": total, "page": page, "size": size, "logs": logs}
    except Exception as e:
        logger.error("Search failed: %s", e)
        return {"total": 0, "page": page, "size": size, "logs": []}


async def get_log_stats() -> dict:
    """Get aggregate statistics across all log indices."""
    es = get_es_client()
    try:
        # Count by provider + by source
        response = await es.search(
            index="logs-*",
            body={
                "size": 0,
                "aggs": {
                    "by_provider": {
                        "terms": {"field": "cloud_provider"}
                    },
                    "by_source": {
                        "terms": {"field": "source_id", "size": 100}
                    }
                }
            }
        )

        hits = response.get("hits", {})
        total = hits.get("total", {}).get("value", 0)
        buckets = response.get("aggregations", {}).get("by_provider", {}).get("buckets", [])
        logs_by_provider = {b["key"]: b["doc_count"] for b in buckets}

        source_buckets = response.get("aggregations", {}).get("by_source", {}).get("buckets", [])
        logs_by_source = {str(b["key"]): b["doc_count"] for b in source_buckets}

        # Get recent logs
        recent = await es.search(
            index="logs-*",
            body={
                "query": {"match_all": {}},
                "sort": [{"timestamp": {"order": "desc"}}],
                "size": 10
            }
        )
        recent_logs = [hit["_source"] for hit in recent.get("hits", {}).get("hits", [])]

        return {
            "total_logs": total,
            "logs_by_provider": logs_by_provider,
            "logs_by_source": logs_by_source,
            "recent_logs": recent_logs,
        }
    except Exception as e:
        logger.error("Stats query failed: %s", e)
        return {"total_logs": 0, "logs_by_provider": {}, "logs_by_source": {}, "recent_logs": []}


async def get_source_stats(source_id: int) -> dict:
    """Get statistics for a specific source."""
    es = get_es_client()
    try:
        response = await es.search(
            index="logs-*",
            body={
                "size": 0,
                "query": {"term": {"source_id": source_id}},
                "aggs": {
                    "error_count": {
                        "filter": {
                            "bool": {
                                "must_not": [
                                    {"terms": {"status": ["200", "201", "204", "Success", "info", "debug"]}}
                                ]
                            }
                        }
                    },
                    "recent_errors": {
                        "filter": {
                            "bool": {
                                "must": [
                                    {"range": {"timestamp": {"gte": "now-15m"}}}
                                ],
                                "must_not": [
                                    {"terms": {"status": ["200", "201", "204", "Success", "info", "debug"]}}
                                ]
                            }
                        }
                    }
                }
            }
        )

        hits = response.get("hits", {})
        total = hits.get("total", {}).get("value", 0)
        error_count = response.get("aggregations", {}).get("error_count", {}).get("doc_count", 0)
        last_15_min_errors = response.get("aggregations", {}).get("recent_errors", {}).get("doc_count", 0)

        return {
            "source_id": source_id,
            "total_logs": total,
            "error_count": error_count,
            "last_15_min_errors": last_15_min_errors,
        }
    except Exception as e:
        logger.error("Source stats query failed: %s", e)
        return {"source_id": source_id, "total_logs": 0, "error_count": 0, "last_15_min_errors": 0}
