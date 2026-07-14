"""Add type field to agent_prototype table.

Revision ID: add_agent_prototype_type
Revises: add_agent_model_provider_tables
Create Date: 2026-07-14
"""

from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_agent_prototype_type"
down_revision: Union[str, None] = "add_agent_model_provider_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add type column to agent_prototype table
    op.add_column(
        "agent_prototype",
        sa.Column(
            "type",
            sa.Enum("SITE_OPERATION", "EXPERT_INTERVIEW", name="agenttype"),
            nullable=False,
            server_default="SITE_OPERATION",
            comment="Agent 类型: SITE_OPERATION 或 EXPERT_INTERVIEW",
        ),
    )

    # Create index on type column
    op.create_index("idx_agent_pt_type", "agent_prototype", ["type"])


def downgrade() -> None:
    # Drop index
    op.drop_index("idx_agent_pt_type", table_name="agent_prototype")

    # Drop column
    op.drop_column("agent_prototype", "type")
