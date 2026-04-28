"""Add agent prototype tables

Revision ID: 008_add_agent_prototype_tables
Revises: 007
Create Date: 2026-04-28 22:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '008_add_agent_prototype_tables'
down_revision: Union[str, None] = '007_add_version_and_skill_version'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create agent_prototypes table
    op.create_table(
        'agent_prototype',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(50), nullable=False, server_default='1.0.0'),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('temperature', sa.Float(), server_default='0.7', nullable=True),
        sa.Column('max_tokens', sa.Integer(), server_default='4096', nullable=True),
        sa.Column('prompts', sa.JSON(), server_default='{}', nullable=False),
        sa.Column('status', sa.String(20), server_default='draft', nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.Column('updated_by', sa.BigInteger(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_agent_prototype_created_by'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], name='fk_agent_prototype_updated_by'),
        sa.PrimaryKeyConstraint('id'),
        mysql_collate='utf8mb4_unicode_ci',
        mysql_default_charset='utf8mb4',
        mysql_engine='InnoDB'
    )

    # Create agent_prototype_versions table
    op.create_table(
        'agent_prototype_version',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('prototype_id', sa.BigInteger(), nullable=False),
        sa.Column('version', sa.String(50), nullable=False),
        sa.Column('prompts_snapshot', sa.JSON(), nullable=False),
        sa.Column('config_snapshot', sa.JSON(), nullable=False),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['prototype_id'], ['agent_prototype.id'], name='fk_agent_prototype_versionPrototype_id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_agent_prototype_version_created_by'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prototype_id', 'version', name='uq_agent_prototype_version_prototype_version'),
        mysql_collate='utf8mb4_unicode_ci',
        mysql_default_charset='utf8mb4',
        mysql_engine='InnoDB'
    )


def downgrade() -> None:
    op.drop_table('agent_prototype_version')
    op.drop_table('agent_prototype')
