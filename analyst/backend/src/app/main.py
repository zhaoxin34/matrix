"""FastAPI application entry point for Analyst backend."""

import logging
import os
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import collect_router
from app.config import settings

# Setup logging
_log_dir = os.environ.get("LOG_DIR", settings.LOG_DIR)
if not os.path.exists(_log_dir):
    os.makedirs(_log_dir)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(
            os.path.join(_log_dir, "analyst-backend.log"),
            maxBytes=10485760,  # 10MB
            backupCount=5,
        ),
    ],
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Analyst API",
    description="Analyst backend API for data warehouse and user behavior collection",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(collect_router, prefix="/api/v1")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event() -> None:
    """Startup event handler."""
    logger.info("Analyst backend started")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Shutdown event handler."""
    logger.info("Analyst backend shutting down")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
