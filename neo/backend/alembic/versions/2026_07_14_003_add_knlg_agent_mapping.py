"""Add knlg_agent_mapping table.

Revision ID: add_knlg_agent_mapping
Revises: add_agent_prototype_type
Create Date: 2026-07-14

Adds the knlg_agent_mapping table that stores (workspace_id, type) -> agent_id
mappings. This serves as the single source of truth for which Agent instance
should be used for a given type within a workspace (e.g. expert_interview).

Constraints:
- UNIQUE KEY (workspace_id, type): business uniqueness rule
- INDEX (workspace_id): for list-by-workspace queries
- Foreign keys: workspace_id -> workspaces.id (CASCADE), agent_id -> agent.id (RESTRICT)
"""

from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_knlg_agent_mapping"
down_revision: Union[str, None] = "add_agent_prototype_type"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "knlg_agent_mapping",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False, comment="所属 Workspace ID"),
        sa.Column(
            "type",
            sa.String(length=32),
            nullable=False,
            comment="用途类型，如 expert_interview / sales_assistant",
        ),
        sa.Column("agent_id", sa.Integer(), nullable=False, comment="关联 Agent 实例 ID"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            ondelete="CASCADE",
            name="fk_knlg_agent_mapping_workspace",
        ),
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["agent.id"],
            ondelete="RESTRICT",
            name="fk_knlg_agent_mapping_agent",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id",
            "type",
            name="uk_knlg_agent_mapping_workspace_type",
        ),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index(
        "idx_knlg_agent_mapping_workspace",
        "knlg_agent_mapping",
        ["workspace_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_knlg_agent_mapping_workspace", table_name="knlg_agent_mapping")
    op.drop_table("knlg_agent_mapping")
