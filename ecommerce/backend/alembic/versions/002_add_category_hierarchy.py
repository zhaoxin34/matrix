"""Add category hierarchy columns

Revision ID: 002
Revises: 001
Create Date: 2026-04-16 15:17:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('categories', sa.Column('parent_id', sa.Integer(), nullable=True))
    op.add_column('categories', sa.Column('level', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('categories', sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'))
    op.create_foreign_key('fk_categories_parent', 'categories', 'categories', ['parent_id'], ['id'])
    op.create_index(op.f('ix_categories_parent_id'), 'categories', ['parent_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_categories_parent_id'), table_name='categories')
    op.drop_constraint('fk_categories_parent', table_name='categories', type_='foreignkey')
    op.drop_column('categories', 'sort_order')
    op.drop_column('categories', 'level')
    op.drop_column('categories', 'parent_id')