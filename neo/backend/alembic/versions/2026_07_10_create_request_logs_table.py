"""Create request_logs table.

Revision ID: 2026_07_10_001
Revises: 2026_07_04_001
Create Date: 2026-07-10

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_07_10_001"
down_revision = "2026_07_04_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create request_logs table."""
    op.create_table(
        "request_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("request_id", sa.String(32), nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("embedded_site_id", sa.Integer(), nullable=False),
        sa.Column("event", sa.Enum("start", "complete", "error", name="requestlogevent"), nullable=False),
        sa.Column("type", sa.Enum("fetch", "xhr", name="requestlogtype"), nullable=False),
        sa.Column("method", sa.String(10), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("request_headers", sa.JSON(), nullable=True),
        sa.Column("request_body", sa.Text(), nullable=True),
        sa.Column("status", sa.SmallInteger(), nullable=True),
        sa.Column("status_text", sa.String(50), nullable=True),
        sa.Column("response_headers", sa.JSON(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("tab_id", sa.String(32), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["embedded_site_id"], ["embedded_sites.id"], ondelete="CASCADE"),
    )

    # Create indexes
    op.create_index("idx_rl_workspace", "request_logs", ["workspace_id"])
    op.create_index("idx_rl_embedded_site", "request_logs", ["embedded_site_id"])
    op.create_index("idx_rl_request_id", "request_logs", ["request_id"])
    op.create_index("idx_rl_session_id", "request_logs", ["session_id"])
    op.create_index("idx_rl_created_at", "request_logs", ["created_at"])
    op.create_index("idx_rl_workspace_created", "request_logs", ["workspace_id", "created_at"])


def downgrade() -> None:
    """Drop request_logs table."""
    op.drop_index("idx_rl_workspace_created", table_name="request_logs")
    op.drop_index("idx_rl_created_at", table_name="request_logs")
    op.drop_index("idx_rl_session_id", table_name="request_logs")
    op.drop_index("idx_rl_request_id", table_name="request_logs")
    op.drop_index("idx_rl_embedded_site", table_name="request_logs")
    op.drop_index("idx_rl_workspace", table_name="request_logs")
    op.drop_table("request_logs")
    op.execute("DROP TYPE IF EXISTS requestlogevent")
    op.execute("DROP TYPE IF EXISTS requestlogtype")
