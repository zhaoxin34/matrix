"""API v1 package."""

from app.api.v1 import (
    admin_users,
    agent_prototype,
    auth,
    employees,
    health,
    org_units,
    recording,
    recording_segment_comments,
    skills,
    tasks,
    workspaces,
)

__all__ = [
    "admin_users",
    "agent_prototype",
    "auth",
    "employees",
    "health",
    "org_units",
    "recording",
    "recording_segment_comments",
    "workspaces",
    "skills",
    "tasks",
]
