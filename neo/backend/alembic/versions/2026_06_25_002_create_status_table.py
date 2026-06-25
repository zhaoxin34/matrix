"""Create status table.

Revision ID: 2026_06_25_002
Revises: 2026_06_25_001
Create Date: 2026-06-25

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_06_25_002"
down_revision = "2026_06_25_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create status table."""
    op.create_table(
        "statuses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_name", sa.String(255), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("captured_at", sa.DateTime(), nullable=False),
        sa.Column("source", sa.String(128), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("embedded_site_id", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["embedded_site_id"], ["embedded_sites.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("entity_name", "captured_at", name="uk_st_entity_captured"),
    )

    # Create indexes for status
    op.create_index("idx_st_workspace", "statuses", ["workspace_id"])
    op.create_index("idx_st_entity_name", "statuses", ["entity_name"])
    op.create_index("idx_st_captured_at", "statuses", ["captured_at"])
    op.create_index("idx_st_source", "statuses", ["source"])
    op.create_index("idx_st_session_id", "statuses", ["session_id"])
    op.create_index("idx_st_created_by", "statuses", ["created_by"])
    op.create_index("idx_st_embedded_site", "statuses", ["embedded_site_id"])


def downgrade() -> None:
    """Drop status table."""
    op.drop_index("idx_st_embedded_site", table_name="statuses")
    op.drop_index("idx_st_created_by", table_name="statuses")
    op.drop_index("idx_st_session_id", table_name="statuses")
    op.drop_index("idx_st_source", table_name="statuses")
    op.drop_index("idx_st_captured_at", table_name="statuses")
    op.drop_index("idx_st_entity_name", table_name="statuses")
    op.drop_index("idx_st_workspace", table_name="statuses")
    op.drop_table("statuses")
