"""Neo Backend API application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    admin_users,
    agent_mapping,
    agent_prototype,
    agents,
    auth,
    embedded_sites,
    employees,
    events,
    health,
    interceptors,
    model_provider,
    my_tasks,
    org_units,
    recording,
    recording_segment_comments,
    request_logger,
    skills,
    status,
    tasks,
    workspaces,
)
from app.api.v1.knlg_base import get_knlg_base_router
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
    # Allow all origins for development - use allow_origin_regex to match
    # any origin (more permissive than allow_origins=["*"] which doesn't
    # work with allow_credentials=True)
    allow_origins=[],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
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
app.include_router(model_provider.router, prefix="/api/v1")
app.include_router(agent_mapping.router, prefix="/api/v1")
app.include_router(embedded_sites.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1/workspaces/{workspace_code}")
app.include_router(tasks.router, prefix="/api/v1/workspaces/{workspace_code}")
app.include_router(recording.router, prefix="/api/v1")
app.include_router(recording_segment_comments.router, prefix="/api/v1")
app.include_router(my_tasks.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(status.router, prefix="/api/v1")
app.include_router(interceptors.router, prefix="/api/v1/workspaces/{workspace_code}")
app.include_router(request_logger.router, prefix="/api/v1")

# knlg-base (knowledge base & QA library) sub-router
app.include_router(get_knlg_base_router(), prefix="/api/v1/workspaces/{workspace_code}/knlg-base")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
