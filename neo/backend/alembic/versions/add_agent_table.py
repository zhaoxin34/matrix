"""add agent table

Revision ID: add_agent_table
Revises: 241a25fa9a26
Create Date: 2026-05-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_agent_table'
down_revision: Union[str, None] = '241a25fa9a26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create agent table without FK constraints (application handles referential integrity)
    op.create_table(
        'agent',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=32), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('prototype_id', sa.Integer(), nullable=False),
        sa.Column('prototype_version', sa.String(length=32), nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('model', sa.String(length=64), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_agent_name', 'agent', ['name'], unique=False)
    op.create_index('ix_agent_workspace_id', 'agent', ['workspace_id'], unique=False)
    op.create_index('ix_agent_prototype_id', 'agent', ['prototype_id'], unique=False)
    op.create_index('ix_agent_status', 'agent', ['status'], unique=False)
    op.create_index('ix_agent_created_by', 'agent', ['created_by'], unique=False)
    op.create_index('idx_agent_workspace_status', 'agent', ['workspace_id', 'status'], unique=False)
    op.create_index('uk_agent_workspace_name', 'agent', ['workspace_id', 'name'], unique=True)


def downgrade() -> None:
    op.drop_index('uk_agent_workspace_name', table_name='agent')
    op.drop_index('idx_agent_workspace_status', table_name='agent')
    op.drop_index('ix_agent_created_by', table_name='agent')
    op.drop_index('ix_agent_status', table_name='agent')
    op.drop_index('ix_agent_prototype_id', table_name='agent')
    op.drop_index('ix_agent_workspace_id', table_name='agent')
    op.drop_index('ix_agent_name', table_name='agent')
    op.drop_table('agent')
