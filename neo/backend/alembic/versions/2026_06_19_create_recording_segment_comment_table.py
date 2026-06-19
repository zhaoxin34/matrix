"""create recording_segment_comment table

Revision ID: a1b2c3d4e5f6
Revises: 8a1f3c5d2b4e
Create Date: 2026-06-19 10:00:00.000000

Implements OpenSpec change: recording-segment-comment (Task 1.4)
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "8a1f3c5d2b4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recording_segment_comment",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uid", sa.String(length=36), nullable=False),
        sa.Column("recording_id", sa.Integer(), nullable=False),
        sa.Column("segment_id", sa.Integer(), nullable=False),
        sa.Column("show_time", sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column("hide_time", sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column("abstract", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["creator_id"],
            ["users.id"],
            name="fk_recording_segment_comment_creator",
        ),
        sa.ForeignKeyConstraint(
            ["recording_id"],
            ["recording.id"],
            ondelete="CASCADE",
            name="fk_recording_segment_comment_recording",
        ),
        sa.ForeignKeyConstraint(
            ["segment_id"],
            ["segment.id"],
            ondelete="CASCADE",
            name="fk_recording_segment_comment_segment",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "hide_time > show_time",
            name="chk_recording_segment_comment_time_range",
        ),
        sa.CheckConstraint(
            "show_time >= 0",
            name="chk_recording_segment_comment_show_time_non_negative",
        ),
    )
    op.create_index(
        op.f("ix_recording_segment_comment_uid"),
        "recording_segment_comment",
        ["uid"],
        unique=True,
    )
    op.create_index(
        "idx_recording_segment_comment_seg",
        "recording_segment_comment",
        ["segment_id", "show_time"],
        unique=False,
    )
    op.create_index(
        "idx_recording_segment_comment_rec",
        "recording_segment_comment",
        ["recording_id"],
        unique=False,
    )
    op.create_index(
        "idx_recording_segment_comment_creator",
        "recording_segment_comment",
        ["creator_id"],
        unique=False,
    )


def downgrade() -> None:
    # Drop foreign keys before indexes/table (FKs depend on the creator_id index)
    op.drop_constraint(
        "fk_recording_segment_comment_creator",
        "recording_segment_comment",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_recording_segment_comment_recording",
        "recording_segment_comment",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_recording_segment_comment_segment",
        "recording_segment_comment",
        type_="foreignkey",
    )
    op.drop_index("idx_recording_segment_comment_creator", table_name="recording_segment_comment")
    op.drop_index("idx_recording_segment_comment_rec", table_name="recording_segment_comment")
    op.drop_index("idx_recording_segment_comment_seg", table_name="recording_segment_comment")
    op.drop_index(op.f("ix_recording_segment_comment_uid"), table_name="recording_segment_comment")
    op.drop_table("recording_segment_comment")
