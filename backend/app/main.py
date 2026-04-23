from contextlib import asynccontextmanager
from fastapi import FastAPI

from .routers import ingest, search, sources, cloud_auth, ai_insights
from .services.elasticsearch import ensure_index_template, close_es_client
from .services.log_sync import start_sync_task, stop_sync_task
from .services.ai_alerts import ensure_ai_alerts_template
from .services.ai_monitor import start_ai_monitor, stop_ai_monitor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create ES index templates, start log sync + AI monitor. Shutdown: stop all, close ES."""
    await ensure_index_template()
    await ensure_ai_alerts_template()
    start_sync_task()
    start_ai_monitor()
    yield
    await stop_ai_monitor()
    await stop_sync_task()
    await close_es_client()


app = FastAPI(
    title="Pinnacle SIEM Backend",
    description="Multi-cloud log ingestion, normalization, and search engine.",
    lifespan=lifespan,
)

# Mount routers
app.include_router(ingest.router)
app.include_router(search.router)
app.include_router(sources.router)
app.include_router(cloud_auth.router)
app.include_router(ai_insights.router)


@app.get("/")
def read_root():
    return {"status": "SIEM Backend is running", "version": "1.0"}
