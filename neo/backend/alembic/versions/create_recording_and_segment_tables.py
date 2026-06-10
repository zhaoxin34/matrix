"""create recording and segment tables

Revision ID: 36997c8878bf
Revises: create_task_tables
Create Date: 2026-06-10 21:52:47.448398

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "36997c8878bf"
down_revision: Union[str, None] = "create_task_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create recording table
    op.create_table(
        "recording",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uid", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False),
        sa.Column("status", sa.Enum("RECORDING", "COMPLETED", "FAILED", name="recordingstatus"), nullable=False),
        sa.Column("enter_url", sa.String(length=2048), nullable=True),
        sa.Column("exit_url", sa.String(length=2048), nullable=True),
        sa.Column("total_duration", sa.Integer(), nullable=False),
        sa.Column("total_size", sa.BigInteger(), nullable=False),
        sa.Column("source", sa.Enum("AGENT", "UPLOAD", name="recordingsource"), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_recording_created_at", "recording", ["created_at"], unique=False)
    op.create_index("idx_recording_name", "recording", ["name"], unique=False)
    op.create_index("idx_recording_workspace_status", "recording", ["workspace_id", "status"], unique=False)
    op.create_index(op.f("ix_recording_uid"), "recording", ["uid"], unique=True)
    op.create_index(op.f("ix_recording_workspace_id"), "recording", ["workspace_id"], unique=False)

    # Create segment table
    op.create_table(
        "segment",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uid", sa.String(length=36), nullable=False),
        sa.Column("recording_id", sa.Integer(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=True),
        sa.Column("page_urls", sa.Text(), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["recording_id"], ["recording.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_segment_recording_id"), "segment", ["recording_id"], unique=False)
    op.create_index(op.f("ix_segment_uid"), "segment", ["uid"], unique=True)
    op.create_index("uk_segment_recording_sequence", "segment", ["recording_id", "sequence"], unique=True)


def downgrade() -> None:
    op.drop_index("uk_segment_recording_sequence", table_name="segment")
    op.drop_index(op.f("ix_segment_uid"), table_name="segment")
    op.drop_index(op.f("ix_segment_recording_id"), table_name="segment")
    op.drop_table("segment")
    op.drop_index(op.f("ix_recording_workspace_id"), table_name="recording")
    op.drop_index(op.f("ix_recording_uid"), table_name="recording")
    op.drop_index("idx_recording_workspace_status", table_name="recording")
    op.drop_index("idx_recording_name", table_name="recording")
    op.drop_index("idx_recording_created_at", table_name="recording")
    op.drop_table("recording")
