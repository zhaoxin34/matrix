"""add version column to skill table and create skill_version table

Revision ID: 007_add_version_and_skill_version
Revises: 006
Create Date: 2026-04-28 01:27:38.097449

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '007_add_version_and_skill_version'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add version column to skill table
    op.add_column('skill', sa.Column('version', sa.String(50), nullable=True))

    # Create skill_version table
    op.create_table(
        'skill_version',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('skill_id', sa.BigInteger(), nullable=False),
        sa.Column('version', sa.String(50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('comment', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['skill_id'], ['skill.id'], name='fk_skill_version_skill_id'),
        sa.PrimaryKeyConstraint('id'),
        mysql_collate='utf8mb4_unicode_ci',
        mysql_default_charset='utf8mb4',
        mysql_engine='InnoDB'
    )
    # Add unique constraint on (skill_id, version)
    op.create_index('ix_skill_version_skill_version', 'skill_version', ['skill_id', 'version'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_skill_version_skill_version', table_name='skill_version')
    op.drop_table('skill_version')
    op.drop_column('skill', 'version')
