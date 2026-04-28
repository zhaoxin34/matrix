"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    admin_users,
    auth,
    employees,
    health,
    org_dashboard,
    org_units,
    projects,
    skills,
)
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware

# Setup logging before creating the app
setup_logging()

app = FastAPI(
    title="CDP API",
    description="CDP (Customer Data Platform) backend API",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Register exception handlers for unified error format
register_exception_handlers(app)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(health.router, tags=["health"])
app.include_router(org_units.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(org_dashboard.router, prefix="/api/v1")
app.include_router(admin_users.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(skills.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
