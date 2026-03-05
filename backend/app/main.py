from contextlib import asynccontextmanager
from fastapi import FastAPI

from .routers import ingest, search, sources
from .services.elasticsearch import ensure_index_template, close_es_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create ES index template. Shutdown: close ES client."""
    await ensure_index_template()
    yield
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


@app.get("/")
def read_root():
    return {"status": "SIEM Backend is running", "version": "1.0"}
