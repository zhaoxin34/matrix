"""Add skill table

Revision ID: 004
Revises: 003
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'skill',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('code', sa.String(100), nullable=False, unique=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('level', sa.Enum('Planning', 'Functional', 'Atomic', name='skill_level'), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('author', sa.String(50), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_skill_code', 'skill', ['code'], unique=True)
    op.create_index('ix_skill_level', 'skill', ['level'])
    op.create_index('ix_skill_is_active', 'skill', ['is_active'])
    op.create_index('ix_skill_deleted_at', 'skill', ['deleted_at'])


def downgrade() -> None:
    op.drop_index('ix_skill_deleted_at', table_name='skill')
    op.drop_index('ix_skill_is_active', table_name='skill')
    op.drop_index('ix_skill_level', table_name='skill')
    op.drop_index('ix_skill_code', table_name='skill')
    op.drop_table('skill')
    sa.Enum(name='skill_level').drop(op.get_bind(), checkfirst=True)
