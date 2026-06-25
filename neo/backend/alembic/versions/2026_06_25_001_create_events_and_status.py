"""Create events and status tables.

Revision ID: 2026_06_25_001
Revises: a1b2c3d4e5f6
Create Date: 2026-06-25

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_06_25_001"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create events table."""
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("entity_name", sa.String(255), nullable=False),
        sa.Column("target_entity_name", sa.String(255), nullable=True),
        sa.Column("actor", sa.String(255), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("page_url", sa.String(512), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("embedded_site_id", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["embedded_site_id"], ["embedded_sites.id"], ondelete="SET NULL"),
    )

    # Create indexes for events
    op.create_index("idx_ev_workspace", "events", ["workspace_id"])
    op.create_index("idx_ev_name", "events", ["name"])
    op.create_index("idx_ev_entity_name", "events", ["entity_name"])
    op.create_index("idx_ev_actor", "events", ["actor"])
    op.create_index("idx_ev_timestamp", "events", ["timestamp"])
    op.create_index("idx_ev_session_id", "events", ["session_id"])
    op.create_index("idx_ev_created_by", "events", ["created_by"])
    op.create_index("idx_ev_embedded_site", "events", ["embedded_site_id"])


def downgrade() -> None:
    """Drop events table."""
    op.drop_index("idx_ev_embedded_site", table_name="events")
    op.drop_index("idx_ev_created_by", table_name="events")
    op.drop_index("idx_ev_session_id", table_name="events")
    op.drop_index("idx_ev_timestamp", table_name="events")
    op.drop_index("idx_ev_actor", table_name="events")
    op.drop_index("idx_ev_entity_name", table_name="events")
    op.drop_index("idx_ev_name", table_name="events")
    op.drop_index("idx_ev_workspace", table_name="events")
    op.drop_table("events")
