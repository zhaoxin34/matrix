"""Create embedded_sites table.

Revision ID: create_embedded_sites
Revises: init tables
Create Date: 2026-05-29
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "create_embedded_sites"
down_revision = "create_agent_prototype_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create embedded_sites table
    op.create_table(
        "embedded_sites",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "site_name",
            sa.String(length=255, collation="utf8mb4_unicode_ci"),
            nullable=False,
        ),
        sa.Column(
            "site_url",
            sa.String(length=512, collation="utf8mb4_unicode_ci"),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(collation="utf8mb4_unicode_ci"),
            nullable=True,
        ),
        sa.Column(
            "workspace_id",
            sa.Integer(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("enabled", "disabled", name="embedded_site_status"),
            nullable=False,
            server_default="disabled",
        ),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add indexes
    op.create_index("idx_es_workspace", "embedded_sites", ["workspace_id"], unique=False)
    op.create_index("idx_es_site_name", "embedded_sites", ["site_name"], unique=False)
    op.create_index("idx_es_status", "embedded_sites", ["status"], unique=False)
    op.create_index("idx_es_created_by", "embedded_sites", ["created_by"], unique=False)

    # Add unique constraint: same site_name within workspace
    op.create_unique_constraint("uk_es_workspace_name", "embedded_sites", ["workspace_id", "site_name"])


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint("uk_es_workspace_name", "embedded_sites", type_="unique")

    # Drop indexes
    op.drop_index("idx_es_created_by", table_name="embedded_sites")
    op.drop_index("idx_es_status", table_name="embedded_sites")
    op.drop_index("idx_es_site_name", table_name="embedded_sites")
    op.drop_index("idx_es_workspace", table_name="embedded_sites")

    # Drop table
    op.drop_table("embedded_sites")
