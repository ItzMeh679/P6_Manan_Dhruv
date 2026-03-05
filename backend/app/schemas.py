from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ==========================================
# Log Source Schemas (PostgreSQL)
# ==========================================

class LogSourceBase(BaseModel):
    name: str
    cloud_provider: str  # "aws" | "azure" | "gcp"
    description: Optional[str] = None
    is_active: bool = True


class LogSourceCreate(LogSourceBase):
    pass


class LogSource(LogSourceBase):
    id: int
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Normalized Log Schema (Elasticsearch)
# ==========================================

class NormalizedLog(BaseModel):
    """Unified log format stored in Elasticsearch."""
    timestamp: datetime
    source_ip: str
    cloud_provider: str  # "aws" | "azure" | "gcp"
    action: str  # e.g. "GET /", "FunctionAppTrigger", "storage.objects.get"
    status: str  # e.g. "200", "Success"
    raw_log: Any  # Original untouched log for forensics


# ==========================================
# Log Search Schemas
# ==========================================

class LogSearchQuery(BaseModel):
    q: Optional[str] = None  # Full-text search query
    cloud_provider: Optional[str] = None
    source_ip: Optional[str] = None
    start_date: Optional[str] = None  # ISO format
    end_date: Optional[str] = None  # ISO format
    page: int = 1
    size: int = 50


class LogSearchResult(BaseModel):
    total: int
    page: int
    size: int
    logs: List[dict]


class LogStats(BaseModel):
    total_logs: int
    logs_by_provider: dict  # {"aws": 100, "azure": 50, "gcp": 25}
    recent_logs: List[dict]


# ==========================================
# Ingest Schemas
# ==========================================

class AWSIngestPayload(BaseModel):
    logs: List[str]  # Raw Nginx/syslog lines


class AzureIngestPayload(BaseModel):
    records: List[dict]  # Azure Diagnostic Settings JSON records


class GCPIngestPayload(BaseModel):
    message: dict  # GCP Pub/Sub message wrapper
