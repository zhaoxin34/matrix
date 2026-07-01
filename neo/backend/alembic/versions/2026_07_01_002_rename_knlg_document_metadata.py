"""Rename knlg_document.metadata to meta_data.

Revision ID: 2026_07_01_002
Revises: 2026_07_01_001
Create Date: 2026-07-01

Reason: Same fix as knlg_interview_turn — 'metadata' clashes with
SQLAlchemy Base.metadata, causing Pydantic model_validate to receive
MetaData() object instead of a dict.
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_07_01_002"
down_revision = "2026_07_01_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "knlg_document",
        "metadata",
        new_column_name="meta_data",
        existing_type=sa.JSON(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "knlg_document",
        "meta_data",
        new_column_name="metadata",
        existing_type=sa.JSON(),
        existing_nullable=True,
    )
