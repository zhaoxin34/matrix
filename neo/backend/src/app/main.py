"""Neo Backend API application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin_users, agent_prototype, auth, employees, health, org_units, skills, workspaces
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware

setup_logging()

app = FastAPI(
    title="Neo Agent API",
    description="Neo Agent backend API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3300",
        "https://neo.example.com",
    ],
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


@app.get("/health")
async def health_check() -> dict:
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
