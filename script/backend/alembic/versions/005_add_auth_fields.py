"""Add auth fields to users

Revision ID: 005
Revises: 004
Create Date: 2026-04-16 15:27:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('sms_code', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('sms_code_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'sms_code_expires_at')
    op.drop_column('users', 'sms_code')
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_token')
