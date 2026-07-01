"""Add ngram FULLTEXT index on knlg_question.text (Phase 2 W6).

Revision ID: 2026_07_01_004
Revises: 2026_07_01_003
Create Date: 2026-07-01

Adds a ngram FULLTEXT index on knlg_question.text to enable Chinese
keyword search via the /qa/questions endpoint (Phase 2 W6 检索优化).
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_07_01_004"
down_revision = "2026_07_01_003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE knlg_question ADD FULLTEXT INDEX ft_q_text (text) WITH PARSER ngram")


def downgrade() -> None:
    op.drop_index("ft_q_text", table_name="knlg_question")
