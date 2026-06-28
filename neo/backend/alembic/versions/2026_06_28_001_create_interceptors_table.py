"""Create interceptors table.

Revision ID: 2026_06_28_001
Revises: 2026_06_25_002
Create Date: 2026-06-28

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_06_28_001"
down_revision = "2026_06_25_002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "interceptors",
        sa.Column("id", sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column("workspace_id", sa.BigInteger(), nullable=False),
        sa.Column("embedded_site_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("event_name", sa.String(255), nullable=False),
        sa.Column("mode", sa.String(50), nullable=False, default="observe"),
        sa.Column("entity_name", sa.String(255), nullable=False),
        sa.Column("target_entity_name", sa.String(255), nullable=True),
        sa.Column("trigger_type", sa.String(50), nullable=True),
        sa.Column(
            "trigger",
            sa.JSON(),
            nullable=False,
            comment="Trigger configuration: {type: 'dom'|'network', selector?: string, urlPattern?: string, method?: string}",
        ),
        sa.Column("before_actions", sa.JSON(), nullable=True, default=list),
        sa.Column("after_actions", sa.JSON(), nullable=True, default=list),
        sa.Column("page_url_pattern", sa.String(512), nullable=True),
        sa.Column("debounce_ms", sa.Integer(), nullable=False, default=1000),
        sa.Column("status", sa.String(50), nullable=False, default="ENABLED"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("created_by", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add foreign key constraints
    op.create_index("ix_interceptors_workspace_id", "interceptors", ["workspace_id"])
    op.create_index("ix_interceptors_embedded_site_id", "interceptors", ["embedded_site_id"])
    op.create_index("ix_interceptors_status", "interceptors", ["status"])


def downgrade() -> None:
    op.drop_index("ix_interceptors_status", table_name="interceptors")
    op.drop_index("ix_interceptors_embedded_site_id", table_name="interceptors")
    op.drop_index("ix_interceptors_workspace_id", table_name="interceptors")
    op.drop_table("interceptors")
