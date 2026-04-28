"""Add agent prototype tables

Revision ID: 007
Revises: 006
Create Date: 2026-04-28 00:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create agent_prototypes table
    op.create_table(
        'agent_prototype',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(50), nullable=False, server_default='1.0.0'),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('max_tokens', sa.Integer(), nullable=False, server_default='4096'),
        sa.Column('prompt_selections', sa.JSON(), nullable=False),
        sa.Column('status', sa.Enum('draft', 'published', 'archived', name='agent_prototype_status'), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_agent_prototype_status', 'agent_prototype', ['status'])

    # Create agent_prototype_prompts table
    op.create_table(
        'agent_prototype_prompt',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('prototype_id', sa.String(36), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('version', sa.String(50), nullable=False, server_default='1.0.0'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['prototype_id'], ['agent_prototype.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_agent_prototype_prompt_prototype', 'agent_prototype_prompt', ['prototype_id'])
    op.create_index('ix_agent_prototype_prompt_type', 'agent_prototype_prompt', ['type'])
    op.create_index('ix_agent_prototype_prompt_prototype_type', 'agent_prototype_prompt', ['prototype_id', 'type'])

    # Create agent_prototype_versions table
    op.create_table(
        'agent_prototype_version',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('prototype_id', sa.String(36), nullable=False),
        sa.Column('version', sa.String(50), nullable=False),
        sa.Column('config_snapshot', sa.JSON(), nullable=False),
        sa.Column('prompt_snapshot', sa.JSON(), nullable=False),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['prototype_id'], ['agent_prototype.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_agent_prototype_version_prototype_version', 'agent_prototype_version', ['prototype_id', 'version'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_agent_prototype_version_prototype_version', table_name='agent_prototype_version')
    op.drop_table('agent_prototype_version')
    op.drop_index('ix_agent_prototype_prompt_prototype_type', table_name='agent_prototype_prompt')
    op.drop_index('ix_agent_prototype_prompt_type', table_name='agent_prototype_prompt')
    op.drop_index('ix_agent_prototype_prompt_prototype', table_name='agent_prototype_prompt')
    op.drop_table('agent_prototype_prompt')
    op.drop_index('ix_agent_prototype_status', table_name='agent_prototype')
    op.drop_table('agent_prototype')
    sa.Enum(name='agent_prototype_status').drop(op.get_bind(), checkfirst=True)