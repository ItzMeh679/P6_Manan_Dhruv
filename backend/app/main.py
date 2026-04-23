from contextlib import asynccontextmanager
from fastapi import FastAPI

from .routers import ingest, search, sources, cloud_auth
from .services.elasticsearch import ensure_index_template, close_es_client
from .services.log_sync import start_sync_task, stop_sync_task


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create ES index template, start log sync. Shutdown: stop sync, close ES."""
    await ensure_index_template()
    start_sync_task()
    yield
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


@app.get("/")
def read_root():
    return {"status": "SIEM Backend is running", "version": "1.0"}
