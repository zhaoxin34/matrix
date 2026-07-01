"""Rename knlg_interview_turn.metadata to meta_data.

Revision ID: 2026_07_01_001
Revises: 2026_06_30_001
Create Date: 2026-07-01

Reason: 'metadata' clashes with SQLAlchemy Declarative API reserved
attribute (Base.metadata), causing Pydantic model_validate to receive a
MetaData() object instead of a dict, which fails the JSON dict validator.
Renaming the column to 'meta_data' eliminates the name clash and keeps
the public API stable.
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_07_01_001"
down_revision = "2026_06_30_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "knlg_interview_turn",
        "metadata",
        new_column_name="meta_data",
        existing_type=sa.JSON(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "knlg_interview_turn",
        "meta_data",
        new_column_name="metadata",
        existing_type=sa.JSON(),
        existing_nullable=True,
    )
