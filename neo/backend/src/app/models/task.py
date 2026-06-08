"""Task model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Relationship

from app.database import Base


class Task(Base):
    """Task model representing an agent task."""

    __tablename__ = "task"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False, index=True)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agent.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    priority = Column(String(10), nullable=False, default="medium", index=True)
    task_type = Column(String(20), nullable=False, index=True)
    last_exec_status = Column(String(20), nullable=False, default="pending", index=True)
    status = Column(String(10), nullable=False, default="enabled", index=True)
    max_retry = Column(Integer, nullable=False, default=3)
    retry_interval = Column(Integer, nullable=False, default=60)
    webhook_url = Column(String(512), nullable=True)
    webhook_secret = Column(String(128), nullable=True)
    cron_expression = Column(String(64), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = Relationship("Workspace", back_populates="tasks")
    agent = Relationship("Agent")
    owner = Relationship("User")
    records = Relationship("TaskRecord", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, name='{self.name}', task_type='{self.task_type}')>"


class TaskRecord(Base):
    """Task execution record model."""

    __tablename__ = "task_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)
    exec_status = Column(String(10), nullable=False)
    result = Column(Text, nullable=True)
    process = Column(Text, nullable=True)  # JSON stored as text
    failure_reason = Column(Text, nullable=True)
    recording_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    task = Relationship("Task", back_populates="records")

    def __repr__(self) -> str:
        return f"<TaskRecord(id={self.id}, task_id={self.task_id}, exec_status='{self.exec_status}')>"
