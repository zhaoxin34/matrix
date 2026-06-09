"""create task tables

Revision ID: create_task_tables
Revises: add_agent_table
Create Date: 2026-06-09

Changes from previous:
- owner_id → creator_id
- Added executor_id (NOT NULL)
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "create_task_tables"
down_revision: Union[str, Sequence[str], None] = "add_agent_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create task table
    op.create_table(
        "task",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("agent_id", sa.Integer(), nullable=False),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column("executor_id", sa.Integer(), nullable=False),
        sa.Column("priority", sa.String(length=10), nullable=False, server_default="medium"),
        sa.Column("task_type", sa.String(length=20), nullable=False),
        sa.Column("last_exec_status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("status", sa.String(length=10), nullable=False, server_default="enabled"),
        sa.Column("max_retry", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("retry_interval", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("webhook_url", sa.String(length=512), nullable=True),
        sa.Column("webhook_secret", sa.String(length=128), nullable=True),
        sa.Column("cron_expression", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create task indexes
    op.create_index("ix_task_workspace_id", "task", ["workspace_id"], unique=False)
    op.create_index("ix_task_agent_id", "task", ["agent_id"], unique=False)
    op.create_index("ix_task_creator_id", "task", ["creator_id"], unique=False)
    op.create_index("ix_task_executor_id", "task", ["executor_id"], unique=False)
    op.create_index("ix_task_last_exec_status", "task", ["last_exec_status"], unique=False)
    op.create_index("ix_task_status", "task", ["status"], unique=False)
    op.create_index("ix_task_type", "task", ["task_type"], unique=False)
    op.create_index("ix_task_priority", "task", ["priority"], unique=False)
    op.create_index("ix_task_created_at", "task", ["created_at"], unique=False)

    # Create task_record table
    op.create_table(
        "task_record",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("exec_status", sa.String(length=10), nullable=False),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("process", sa.JSON(), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("recording_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create task_record indexes
    op.create_index("ix_task_record_task_id", "task_record", ["task_id"], unique=False)
    op.create_index("ix_task_record_started_at", "task_record", ["started_at"], unique=False)


def downgrade() -> None:
    # Drop task_record indexes
    op.drop_index("ix_task_record_started_at", table_name="task_record")
    op.drop_index("ix_task_record_task_id", table_name="task_record")

    # Drop task_record table
    op.drop_table("task_record")

    # Drop task indexes
    op.drop_index("ix_task_created_at", table_name="task")
    op.drop_index("ix_task_priority", table_name="task")
    op.drop_index("ix_task_type", table_name="task")
    op.drop_index("ix_task_status", table_name="task")
    op.drop_index("ix_task_last_exec_status", table_name="task")
    op.drop_index("ix_task_executor_id", table_name="task")
    op.drop_index("ix_task_creator_id", table_name="task")
    op.drop_index("ix_task_agent_id", table_name="task")
    op.drop_index("ix_task_workspace_id", table_name="task")

    # Drop task table
    op.drop_table("task")
