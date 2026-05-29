"""Create agent_prototype and agent_prototype_version tables.

Revision ID: create_agent_prototype_tables
Revises: create_workspace_tables
Create Date: 2026-05-28
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "create_agent_prototype_tables"
down_revision = "117dfc44c27a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create agent_prototype table
    op.create_table(
        "agent_prototype",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("version", sa.String(length=32), nullable=True),
        sa.Column("model", sa.String(length=64), nullable=False),
        sa.Column("prompts", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("config", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column(
            "status",
            sa.Enum("draft", "enabled", "disabled", name="agentstatus"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("created_by", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    # Create indexes for agent_prototype
    op.create_index("idx_agent_pt_code", "agent_prototype", ["code"], unique=True)
    op.create_index("idx_agent_pt_status", "agent_prototype", ["status"])
    op.create_index("idx_agent_pt_created_by", "agent_prototype", ["created_by"])

    # Create agent_prototype_version table
    op.create_table(
        "agent_prototype_version",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("agent_prototype_id", sa.BigInteger(), nullable=False),
        sa.Column("version", sa.String(length=32), nullable=False),
        sa.Column("prompts_snapshot", sa.JSON(), nullable=False),
        sa.Column("config_snapshot", sa.JSON(), nullable=False),
        sa.Column("change_summary", sa.Text(), nullable=True),
        sa.Column("is_rollback", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_by", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["agent_prototype_id"],
            ["agent_prototype.id"],
            name="fk_agent_prototype_version_agent_prototype",
        ),
    )

    # Create indexes for agent_prototype_version
    op.create_index("idx_agent_version_agent", "agent_prototype_version", ["agent_prototype_id"])
    op.create_index("idx_agent_version_created", "agent_prototype_version", ["created_at"])


def downgrade() -> None:
    # Drop indexes for agent_prototype_version
    op.drop_index("idx_agent_version_created", table_name="agent_prototype_version")
    op.drop_index("idx_agent_version_agent", table_name="agent_prototype_version")

    # Drop agent_prototype_version table
    op.drop_table("agent_prototype_version")

    # Drop indexes for agent_prototype
    op.drop_index("idx_agent_pt_created_by", table_name="agent_prototype")
    op.drop_index("idx_agent_pt_status", table_name="agent_prototype")
    op.drop_index("idx_agent_pt_code", table_name="agent_prototype")

    # Drop agent_prototype table
    op.drop_table("agent_prototype")

    # Drop enum type
    op.execute("DROP TYPE IF EXISTS agentstatus")
