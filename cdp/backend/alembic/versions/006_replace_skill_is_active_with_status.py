"""Replace skill is_active with status enum

Revision ID: 006
Revises: 005
Create Date: 2026-04-27 23:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create new status enum
    status_enum = sa.Enum('draft', 'active', 'disabled', name='skill_status')
    status_enum.create(op.get_bind(), checkfirst=True)

    # Add status column with default value 'draft'
    op.add_column('skill', sa.Column('status', status_enum, nullable=False, server_default='draft'))

    # Migrate existing data: is_active=true -> active, is_active=false -> disabled
    op.execute("UPDATE skill SET status = 'active' WHERE is_active = 1")
    op.execute("UPDATE skill SET status = 'disabled' WHERE is_active = 0")

    # Drop the old column and index
    op.drop_index('ix_skill_is_active', table_name='skill')
    op.drop_column('skill', 'is_active')


def downgrade() -> None:
    # Add back is_active column
    op.add_column('skill', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('0')))

    # Migrate data back: active -> true, disabled -> false, draft -> false (safe default)
    op.execute("UPDATE skill SET is_active = 1 WHERE status = 'active'")
    op.execute("UPDATE skill SET is_active = 0 WHERE status IN ('disabled', 'draft')")

    # Drop status column
    op.drop_column('skill', 'status')

    # Recreate index
    op.create_index('ix_skill_is_active', 'skill', ['is_active'])

    # Drop enum
    sa.Enum(name='skill_status').drop(op.get_bind(), checkfirst=True)