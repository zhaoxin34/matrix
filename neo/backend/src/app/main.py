"""Neo Backend API application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    admin_users,
    agent_prototype,
    agents,
    auth,
    embedded_sites,
    employees,
    health,
    my_tasks,
    org_units,
    recording,
    recording_segment_comments,
    skills,
    tasks,
    workspaces,
)
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware
from app.storage.service import get_rustfs_service

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize resources on startup, cleanup on shutdown."""
    # Startup: ensure RustFS bucket exists
    try:
        storage = get_rustfs_service()
        if storage.bucket_exists():
            logger.info(f"RustFS bucket '{storage.default_bucket}' already exists")
        else:
            storage.create_bucket()
            logger.info(f"RustFS bucket '{storage.default_bucket}' created")
    except Exception as e:
        logger.warning(f"Failed to initialize RustFS bucket: {e}")

    yield

    # Shutdown: cleanup if needed
    logger.info("Application shutting down")


app = FastAPI(
    title="Neo Agent API",
    description="Neo Agent backend API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # Frontend depends on cookies (credentials: "include"); agent-steer uses
    # Authorization Bearer header. Browsers forbid `*` when credentials mode
    # is "include", but Starlette auto-echoes the request Origin in that case.
    # Using `allow_origins=["*"]` lets agent-steer (any tab origin) reach the
    # API without per-extension whitelisting.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

register_exception_handlers(app)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin_users.router, prefix="/api/v1")
app.include_router(org_units.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(workspaces.router, prefix="/api/v1")
app.include_router(skills.router)
app.include_router(agent_prototype.router, prefix="/api/v1")
app.include_router(embedded_sites.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1/workspaces/{workspace_code}")
app.include_router(tasks.router, prefix="/api/v1/workspaces/{workspace_code}")
app.include_router(recording.router, prefix="/api/v1")
app.include_router(recording_segment_comments.router, prefix="/api/v1")
app.include_router(my_tasks.router, prefix="/api/v1")


@app.get("/health")
async def health_check() -> dict:
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
