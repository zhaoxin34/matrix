"""Agent Service FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agent_service.api.interviews import router as interviews_router
from agent_service.config import settings

app = FastAPI(
    title="Agent Service",
    description="Interview Agent Service - AI-powered expert interview system",
    version="0.1.0",
)

# CORS middleware - restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interviews_router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "agent-service"}


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "service": "agent-service",
        "version": "0.1.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "agent_service.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
