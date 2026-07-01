"""Use ngram parser for knlg FULLTEXT indexes (Chinese support).

Revision ID: 2026_07_01_003
Revises: 2026_07_01_002
Create Date: 2026-07-01

Reason: The original FULLTEXT indexes were created with MySQL's default
parser, which only supports Latin/CJK character splitting at whitespace.
For Chinese text (no spaces between words), the default parser cannot
tokenize '制造业' as a single term.

Switching to the ngram parser with WITH PARSER ngram tokenizes text into
2-character overlapping bigrams (ngram_token_size=2), which supports
Chinese fulltext search out of the box.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_07_01_003"
down_revision = "2026_07_01_002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # knlg_knowledge_card.ft_kc_text (4 columns)
    op.drop_index("ft_kc_text", table_name="knlg_knowledge_card")
    op.execute(
        "ALTER TABLE knlg_knowledge_card "
        "ADD FULLTEXT INDEX ft_kc_text "
        "(title, statement, conditions, exceptions) WITH PARSER ngram"
    )

    # knlg_interview_turn.ft_turn_text (2 columns)
    op.drop_index("ft_turn_text", table_name="knlg_interview_turn")
    op.execute("ALTER TABLE knlg_interview_turn ADD FULLTEXT INDEX ft_turn_text (question, answer) WITH PARSER ngram")


def downgrade() -> None:
    # Revert to default parser (no PARSER clause)
    op.drop_index("ft_turn_text", table_name="knlg_interview_turn")
    op.execute("ALTER TABLE knlg_interview_turn ADD FULLTEXT INDEX ft_turn_text (question, answer)")

    op.drop_index("ft_kc_text", table_name="knlg_knowledge_card")
    op.execute(
        "ALTER TABLE knlg_knowledge_card ADD FULLTEXT INDEX ft_kc_text (title, statement, conditions, exceptions)"
    )
