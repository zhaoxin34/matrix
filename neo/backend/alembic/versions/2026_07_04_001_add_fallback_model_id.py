"""Phase 3 — add knlg_llm_model.fallback_model_id (auto-fallback chain).

Revision ID: 2026_07_04_001
Revises: 2026_07_02_001 (Phase 3 AI Interview tables)
Create Date: 2026-07-04
"""

from __future__ import annotations

from alembic import op

revision = "2026_07_04_001"
down_revision = "2026_07_02_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add self-FK fallback_model_id to knlg_llm_model."""
    op.execute(
        """
        ALTER TABLE knlg_llm_model
            ADD COLUMN fallback_model_id INT NULL,
            ADD CONSTRAINT fk_knlg_llm_model_fallback
                FOREIGN KEY (fallback_model_id) REFERENCES knlg_llm_model(id) ON DELETE SET NULL,
            ADD INDEX idx_knlg_llm_model_fallback (fallback_model_id)
        """
    )


def downgrade() -> None:
    """Drop the fallback_model_id column + index + FK."""
    op.execute(
        """
        ALTER TABLE knlg_llm_model
            DROP FOREIGN KEY fk_knlg_llm_model_fallback,
            DROP INDEX idx_knlg_llm_model_fallback,
            DROP COLUMN fallback_model_id
        """
    )
