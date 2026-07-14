"""Add knlg_agent_mapping table.

Revision ID: add_knlg_agent_mapping
Revises: add_agent_prototype_type
Create Date: 2026-07-14

Adds the knlg_agent_mapping table that stores (workspace_id, type) -> agent_id
mappings. The (workspace_id, type) pair is the primary key, enforcing "each
type can be configured once per workspace" at the database level.

Schema:
- PRIMARY KEY (workspace_id, type): enforces uniqueness
- INDEX (workspace_id): for list-by-workspace queries (also covered by PK
  prefix; this index is kept explicit for clarity)
- Foreign keys: workspace_id -> workspaces.id (CASCADE), agent_id -> agent.id (RESTRICT)

Values for `type` are constrained at the application layer to the
AgentPrototypeType enum (currently 'site_operation', 'expert_interview').
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
        sa.Column("workspace_id", sa.Integer(), nullable=False, comment="所属 Workspace ID"),
        sa.Column(
            "type",
            sa.String(length=32),
            nullable=False,
            comment="用途类型，与 agent_prototype.type 对齐：site_operation / expert_interview",
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
        sa.PrimaryKeyConstraint("workspace_id", "type", name="pk_knlg_agent_mapping"),
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
