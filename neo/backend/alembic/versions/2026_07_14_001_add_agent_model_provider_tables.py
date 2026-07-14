"""Add agent_model_provider and agent_model_config tables.

Revision ID: add_agent_model_provider_tables
Revises: 2026_07_11_001
Create Date: 2026-07-14
"""

from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_agent_model_provider_tables"
down_revision: Union[str, None] = "2026_07_11_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create agent_model_provider table
    op.create_table(
        "agent_model_provider",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "api_type",
            sa.String(length=32),
            nullable=False,
            comment="API 类型: openai-completions/anthropic-messages 等",
        ),
        sa.Column(
            "base_url",
            sa.String(length=512),
            nullable=True,
            comment="API 端点 URL",
        ),
        sa.Column(
            "api_key_env",
            sa.String(length=128),
            nullable=True,
            comment="API Key 环境变量名，如 OPENAI_API_KEY",
        ),
        sa.Column("headers", sa.JSON(), nullable=True, comment="自定义请求头"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_by", sa.BigInteger(), nullable=False),
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
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    # Create indexes for agent_model_provider
    op.create_index("idx_agent_mp_code", "agent_model_provider", ["code"], unique=True)
    op.create_index("idx_agent_mp_enabled", "agent_model_provider", ["enabled"])
    op.create_index("idx_agent_mp_created_by", "agent_model_provider", ["created_by"])

    # Create agent_model_config table
    op.create_table(
        "agent_model_config",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("provider_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "model_id",
            sa.String(length=64),
            nullable=False,
            comment="模型标识符，如 gpt-4、claude-3-5-sonnet",
        ),
        sa.Column("display_name", sa.String(length=128), nullable=True, comment="显示名称"),
        sa.Column(
            "context_window",
            sa.Integer(),
            nullable=False,
            comment="上下文窗口大小",
        ),
        sa.Column(
            "max_tokens",
            sa.Integer(),
            nullable=False,
            comment="最大输出 token",
        ),
        sa.Column(
            "supports_thinking",
            sa.Boolean(),
            nullable=False,
            comment="是否支持 thinking",
        ),
        sa.Column(
            "thinking_level_map",
            sa.JSON(),
            nullable=True,
            comment="thinking 级别映射",
        ),
        sa.Column(
            "input_types",
            sa.JSON(),
            nullable=False,
            comment="输入类型: text, image",
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
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
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["agent_model_provider.id"],
            ondelete="CASCADE",
            name="fk_agent_mc_provider",
        ),
        sa.UniqueConstraint("provider_id", "model_id", name="uk_agent_mc_provider_model"),
    )

    # Create indexes for agent_model_config
    op.create_index("idx_agent_mc_provider", "agent_model_config", ["provider_id"])
    op.create_index("idx_agent_mc_enabled", "agent_model_config", ["enabled"])

    # Add columns to agent_prototype table
    op.add_column(
        "agent_prototype",
        sa.Column("provider_id", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "agent_prototype",
        sa.Column("model_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "agent_prototype",
        sa.Column("model_config", sa.JSON(), nullable=True),
    )

    # Add foreign key constraint for provider_id
    op.create_foreign_key(
        "fk_agent_pt_provider",
        "agent_prototype",
        "agent_model_provider",
        ["provider_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    # Drop foreign key constraint from agent_prototype
    op.drop_constraint("fk_agent_pt_provider", "agent_prototype", type_="foreignkey")

    # Drop columns from agent_prototype
    op.drop_column("agent_prototype", "model_config")
    op.drop_column("agent_prototype", "model_id")
    op.drop_column("agent_prototype", "provider_id")

    # Drop indexes for agent_model_config
    op.drop_index("idx_agent_mc_enabled", table_name="agent_model_config")
    op.drop_index("idx_agent_mc_provider", table_name="agent_model_config")

    # Drop agent_model_config table
    op.drop_table("agent_model_config")

    # Drop indexes for agent_model_provider
    op.drop_index("idx_agent_mp_created_by", table_name="agent_model_provider")
    op.drop_index("idx_agent_mp_enabled", table_name="agent_model_provider")
    op.drop_index("idx_agent_mp_code", table_name="agent_model_provider")

    # Drop agent_model_provider table
    op.drop_table("agent_model_provider")
