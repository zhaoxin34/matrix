"""Add product columns for Phase 5

Revision ID: 003
Revises: 002
Create Date: 2026-04-16 15:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('brand', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('original_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('images', sa.JSON(), nullable=True))
    op.add_column('products', sa.Column('sales_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('products', sa.Column('sku_variants', sa.JSON(), nullable=True))
    op.add_column('products', sa.Column('specifications', sa.JSON(), nullable=True))
    op.add_column('products', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))
    op.create_index(op.f('ix_products_brand'), 'products', ['brand'], unique=False)
    op.create_index(op.f('ix_products_category_id'), 'products', ['category_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_products_category_id'), table_name='products')
    op.drop_index(op.f('ix_products_brand'), table_name='products')
    op.drop_column('products', 'is_active')
    op.drop_column('products', 'specifications')
    op.drop_column('products', 'sku_variants')
    op.drop_column('products', 'sales_count')
    op.drop_column('products', 'images')
    op.drop_column('products', 'original_price')
    op.drop_column('products', 'brand')