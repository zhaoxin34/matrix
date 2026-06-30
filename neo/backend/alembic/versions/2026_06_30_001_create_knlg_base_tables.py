"""Create knlg-base tables (L1 问答库 + L2 知识库 + L3 规则库 + L4 AI 配置).

Revision ID: 2026_06_30_001
Revises: 2026_06_28_001
Create Date: 2026-06-30

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "2026_06_30_001"
down_revision = "2026_06_28_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all 17 knlg_* tables, indexes, and FK constraints."""

    # ============================================================
    # L1 问答库 (6 tables)
    # ============================================================

    # 1. knlg_question_tree（问题树模板）
    op.create_table(
        "knlg_question_tree",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("domain", sa.String(64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("questions", sa.JSON(), nullable=False),
        sa.Column("version", sa.String(32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_qt_workspace", "knlg_question_tree", ["workspace_id"])
    op.create_index("idx_qt_domain", "knlg_question_tree", ["domain"])
    op.create_index("idx_qt_active", "knlg_question_tree", ["is_active"])

    # 2. knlg_question（问题）
    op.create_table(
        "knlg_question",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("domain", sa.String(64), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("parent_question_id", sa.Integer(), nullable=True),
        sa.Column("tree_id", sa.Integer(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default="pending",
            comment="pending / in_progress / answered / archived",
        ),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["parent_question_id"],
            ["knlg_question.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["tree_id"],
            ["knlg_question_tree.id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index("idx_q_workspace", "knlg_question", ["workspace_id"])
    op.create_index("idx_q_domain", "knlg_question", ["domain"])
    op.create_index("idx_q_status", "knlg_question", ["status"])
    op.create_index("idx_q_tree", "knlg_question", ["tree_id"])
    op.create_index("idx_q_parent", "knlg_question", ["parent_question_id"])

    # 3. knlg_interview_session（访谈会话）
    op.create_table(
        "knlg_interview_session",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("expert_id", sa.Integer(), nullable=False),
        sa.Column("topic", sa.String(255), nullable=False),
        sa.Column(
            "mode",
            sa.String(32),
            nullable=False,
            comment="ai_agent / manual",
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["expert_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_iss_workspace", "knlg_interview_session", ["workspace_id"])
    op.create_index("idx_iss_expert", "knlg_interview_session", ["expert_id"])

    # 4. knlg_interview（访谈）
    op.create_table(
        "knlg_interview",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("expert_id", sa.Integer(), nullable=False),
        sa.Column(
            "mode",
            sa.String(32),
            nullable=False,
            comment="ai_agent / manual",
        ),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["knlg_interview_session.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["question_id"], ["knlg_question.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["expert_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_iv_workspace", "knlg_interview", ["workspace_id"])
    op.create_index("idx_iv_session", "knlg_interview", ["session_id"])
    op.create_index("idx_iv_question", "knlg_interview", ["question_id"])
    op.create_index("idx_iv_expert", "knlg_interview", ["expert_id"])

    # 5. knlg_interview_turn（访谈一问一答）
    op.create_table(
        "knlg_interview_turn",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("interview_id", sa.Integer(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column(
            "type",
            sa.String(32),
            nullable=False,
            server_default="initial",
            comment="initial / followup / counter_example / clarification",
        ),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("parent_turn_id", sa.Integer(), nullable=True),
        sa.Column("source_case_ids", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("expert_id", sa.Integer(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["interview_id"], ["knlg_interview.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["parent_turn_id"],
            ["knlg_interview_turn.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["expert_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_turn_interview", "knlg_interview_turn", ["interview_id"])
    op.create_index("idx_turn_expert", "knlg_interview_turn", ["expert_id"])
    op.create_index("idx_turn_type", "knlg_interview_turn", ["type"])
    op.create_index("idx_turn_parent", "knlg_interview_turn", ["parent_turn_id"])
    op.create_index("idx_turn_workspace", "knlg_interview_turn", ["workspace_id"])
    op.create_index("idx_turn_created", "knlg_interview_turn", ["created_at"])
    op.create_index("ft_turn_text", "knlg_interview_turn", ["question", "answer"], mysql_prefix="FULLTEXT")

    # 6. knlg_interview_turn_ref（问答引用）
    op.create_table(
        "knlg_interview_turn_ref",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("source_turn_id", sa.Integer(), nullable=False),
        sa.Column("target_turn_id", sa.Integer(), nullable=False),
        sa.Column(
            "relation",
            sa.String(32),
            nullable=False,
            comment="support / counter_example / refine / derived_from / replaced_by",
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["source_turn_id"],
            ["knlg_interview_turn.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_turn_id"],
            ["knlg_interview_turn.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint(
            "source_turn_id",
            "target_turn_id",
            "relation",
            name="uk_turn_ref_source_target",
        ),
    )
    op.create_index("idx_trf_source", "knlg_interview_turn_ref", ["source_turn_id"])
    op.create_index("idx_trf_target", "knlg_interview_turn_ref", ["target_turn_id"])

    # ============================================================
    # L2 知识库 (3 tables)
    # ============================================================

    # 7. knlg_knowledge_card（知识卡片）
    op.create_table(
        "knlg_knowledge_card",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("domain", sa.String(64), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column(
            "type",
            sa.String(32),
            nullable=False,
            comment="judgement / risk / opportunity / process / communication / competitive",
        ),
        sa.Column("key_signals", sa.JSON(), nullable=True),
        sa.Column("conditions", sa.Text(), nullable=True),
        sa.Column("exceptions", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("confidence_breakdown", sa.JSON(), nullable=True),
        sa.Column(
            "validation_status",
            sa.String(32),
            nullable=False,
            server_default="pending_validation",
            comment="pending_validation / partially_validated / validated / auto_published",
        ),
        sa.Column("source_turn_ids", sa.JSON(), nullable=True),
        sa.Column("source_doc_ids", sa.JSON(), nullable=True),
        sa.Column("source_pattern_ids", sa.JSON(), nullable=True),
        sa.Column("expert_ids", sa.JSON(), nullable=True),
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default="draft",
            comment="draft / reviewing / published / deprecated",
        ),
        sa.Column("version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_kc_workspace", "knlg_knowledge_card", ["workspace_id"])
    op.create_index("idx_kc_domain", "knlg_knowledge_card", ["domain"])
    op.create_index("idx_kc_type", "knlg_knowledge_card", ["type"])
    op.create_index("idx_kc_status", "knlg_knowledge_card", ["status"])
    op.create_index("idx_kc_validation", "knlg_knowledge_card", ["validation_status"])
    op.create_index("idx_kc_confidence", "knlg_knowledge_card", ["confidence"])
    op.create_index(
        "ft_kc_text",
        "knlg_knowledge_card",
        ["title", "statement", "conditions", "exceptions"],
        mysql_prefix="FULLTEXT",
    )

    # 8. knlg_source_ref（来源关联）
    op.create_table(
        "knlg_source_ref",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("kc_id", sa.Integer(), nullable=False),
        sa.Column(
            "source_type",
            sa.String(32),
            nullable=False,
            comment="expert_interview / document / data_pattern",
        ),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("source_excerpt", sa.Text(), nullable=True),
        sa.Column("contribution_weight", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["kc_id"],
            ["knlg_knowledge_card.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_sr_kc", "knlg_source_ref", ["kc_id"])
    op.create_index("idx_sr_source", "knlg_source_ref", ["source_type", "source_id"])
    op.create_index("idx_sr_workspace", "knlg_source_ref", ["workspace_id"])

    # 9. knlg_knowledge_card_version（知识卡片版本）
    op.create_table(
        "knlg_knowledge_card_version",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("kc_id", sa.Integer(), nullable=False),
        sa.Column("version", sa.String(32), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("change_note", sa.Text(), nullable=True),
        sa.Column("changed_by", sa.Integer(), nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["kc_id"],
            ["knlg_knowledge_card.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["changed_by"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_kcv_kc", "knlg_knowledge_card_version", ["kc_id"])
    op.create_index("idx_kcv_workspace", "knlg_knowledge_card_version", ["workspace_id"])

    # ============================================================
    # L2 候选 (4 tables)
    # ============================================================

    # 10. knlg_document（源文档）
    op.create_table(
        "knlg_document",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "type",
            sa.String(32),
            nullable=False,
            comment="wiki / confluence / pdf / docx / md / csv / email / meeting_notes",
        ),
        sa.Column("source_url", sa.String(1024), nullable=True),
        sa.Column("file_path", sa.String(1024), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("hash", sa.String(64), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("imported_by", sa.Integer(), nullable=False),
        sa.Column("imported_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["imported_by"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_doc_workspace", "knlg_document", ["workspace_id"])
    op.create_index("idx_doc_type", "knlg_document", ["type"])
    op.create_index("idx_doc_hash", "knlg_document", ["hash"])

    # 11. knlg_import_job（导入任务）
    op.create_table(
        "knlg_import_job",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default="pending",
            comment="pending / parsing / classifying / extracting / completed / failed",
        ),
        sa.Column("progress", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("result_summary", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["knlg_document.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_ij_workspace", "knlg_import_job", ["workspace_id"])
    op.create_index("idx_ij_document", "knlg_import_job", ["document_id"])
    op.create_index("idx_ij_status", "knlg_import_job", ["status"])

    # 12. knlg_parsed_chunk（解析片段）
    op.create_table(
        "knlg_parsed_chunk",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "category",
            sa.String(32),
            nullable=False,
            comment="decision_experience / general_knowledge / mixed",
        ),
        sa.Column("key_signals", sa.JSON(), nullable=True),
        sa.Column("confidence_hint", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("chunk_order", sa.Integer(), nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["job_id"],
            ["knlg_import_job.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
    )
    op.create_index("idx_pc_workspace", "knlg_parsed_chunk", ["workspace_id"])
    op.create_index("idx_pc_job", "knlg_parsed_chunk", ["job_id"])

    # 13. knlg_candidate_kc（候选知识卡片）
    op.create_table(
        "knlg_candidate_kc",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("chunk_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("key_signals", sa.JSON(), nullable=True),
        sa.Column("candidate_confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("confidence_breakdown", sa.JSON(), nullable=True),
        sa.Column(
            "validation_status",
            sa.String(32),
            nullable=False,
            server_default="pending",
            comment="pending / validating / validated / rejected / auto_published / abandoned",
        ),
        sa.Column("validation_sources", sa.JSON(), nullable=True),
        sa.Column("triggered_interview_id", sa.Integer(), nullable=True),
        sa.Column("promoted_kc_id", sa.Integer(), nullable=True),
        sa.Column("reviewer_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["job_id"],
            ["knlg_import_job.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["chunk_id"],
            ["knlg_parsed_chunk.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["triggered_interview_id"],
            ["knlg_interview.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["promoted_kc_id"],
            ["knlg_knowledge_card.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_ck_job", "knlg_candidate_kc", ["job_id"])
    op.create_index("idx_ck_status", "knlg_candidate_kc", ["validation_status"])
    op.create_index("idx_ck_interview", "knlg_candidate_kc", ["triggered_interview_id"])
    op.create_index("idx_ck_promoted", "knlg_candidate_kc", ["promoted_kc_id"])
    op.create_index("idx_ck_workspace", "knlg_candidate_kc", ["workspace_id"])
    op.create_index("idx_ck_confidence", "knlg_candidate_kc", ["candidate_confidence"])

    # ============================================================
    # L3 规则库 (3 tables)
    # ============================================================

    # 14. knlg_rule（规则）
    op.create_table(
        "knlg_rule",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_kc_id", sa.Integer(), nullable=False),
        sa.Column("scope", sa.JSON(), nullable=False),
        sa.Column(
            "trigger",
            sa.JSON(),
            nullable=False,
            comment="触发器（订阅 Event）",
        ),
        sa.Column("conditions", sa.JSON(), nullable=False),
        sa.Column("conclusion", sa.JSON(), nullable=False),
        sa.Column("exceptions", sa.JSON(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("version", sa.String(32), nullable=False, server_default="1.0"),
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default="draft",
            comment="draft / testing / active / paused / deprecated",
        ),
        sa.Column("execution_stats", sa.JSON(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["source_kc_id"],
            ["knlg_knowledge_card.id"],
            ondelete="RESTRICT",
        ),
    )
    op.create_index("idx_r_workspace", "knlg_rule", ["workspace_id"])
    op.create_index("idx_r_kc", "knlg_rule", ["source_kc_id"])
    op.create_index("idx_r_status", "knlg_rule", ["status"])
    op.create_index("idx_r_confidence", "knlg_rule", ["confidence"])

    # 15. knlg_evidence（证据）
    op.create_table(
        "knlg_evidence",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("rule_id", sa.Integer(), nullable=False),
        sa.Column(
            "case_source",
            sa.String(64),
            nullable=False,
            comment="opportunity / ticket / event",
        ),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("case_data", sa.JSON(), nullable=True),
        sa.Column("outcome", sa.String(64), nullable=True),
        sa.Column("matched_rule", sa.Boolean(), nullable=False),
        sa.Column("support_score", sa.Float(), nullable=False),
        sa.Column("validated_at", sa.DateTime(), nullable=False),
        sa.Column(
            "validator_type",
            sa.String(32),
            nullable=False,
            comment="historical_backtest / expert_judgement / live_outcome",
        ),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["rule_id"],
            ["knlg_rule.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("idx_ev_rule", "knlg_evidence", ["rule_id"])
    op.create_index("idx_ev_case", "knlg_evidence", ["case_source", "case_id"])
    op.create_index("idx_ev_workspace", "knlg_evidence", ["workspace_id"])

    # 16. knlg_rule_execution（规则执行日志）
    op.create_table(
        "knlg_rule_execution",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("rule_id", sa.Integer(), nullable=False),
        sa.Column("entity_name", sa.String(255), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=True),
        sa.Column("triggered_at", sa.DateTime(), nullable=False),
        sa.Column("evaluation_result", sa.JSON(), nullable=False),
        sa.Column("conclusion_executed", sa.JSON(), nullable=True),
        sa.Column(
            "user_action",
            sa.String(64),
            nullable=True,
            comment="采纳/忽略/未操作",
        ),
        sa.Column("user_action_at", sa.DateTime(), nullable=True),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["rule_id"],
            ["knlg_rule.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("idx_exec_rule", "knlg_rule_execution", ["rule_id"])
    op.create_index("idx_exec_entity", "knlg_rule_execution", ["entity_name"])
    op.create_index("idx_exec_triggered", "knlg_rule_execution", ["triggered_at"])
    op.create_index("idx_exec_workspace", "knlg_rule_execution", ["workspace_id"])

    # ============================================================
    # L4 AI 配置 (3 tables)
    # ============================================================

    # 17a. knlg_llm_provider（LLM 提供方）
    op.create_table(
        "knlg_llm_provider",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("display_name", sa.String(128), nullable=False),
        sa.Column("api_base_url", sa.String(512), nullable=True),
        sa.Column("api_key_secret", sa.String(128), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uk_llm_provider_name"),
    )

    # 17b. knlg_llm_model（模型）
    op.create_table(
        "knlg_llm_model",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("display_name", sa.String(128), nullable=False),
        sa.Column("max_tokens", sa.Integer(), nullable=False),
        sa.Column("cost_per_1k_input", sa.Numeric(10, 6), nullable=True),
        sa.Column("cost_per_1k_output", sa.Numeric(10, 6), nullable=True),
        sa.Column("capabilities", sa.JSON(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["knlg_llm_provider.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("idx_llm_model_provider", "knlg_llm_model", ["provider_id"])

    # 17c. knlg_llm_prompt（Prompt 模板）
    op.create_table(
        "knlg_llm_prompt",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column(
            "category",
            sa.String(64),
            nullable=False,
            comment="interview/extract/extract_signal/classify/...",
        ),
        sa.Column("version", sa.String(32), nullable=False),
        sa.Column("template", sa.Text(), nullable=False),
        sa.Column("variables", sa.JSON(), nullable=False),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.Column("parameters", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("workspace_id", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["model_id"],
            ["knlg_llm_model.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("name", "version", name="idx_prompt_name_version"),
    )
    op.create_index("idx_prompt_category", "knlg_llm_prompt", ["category"])
    op.create_index("idx_prompt_active", "knlg_llm_prompt", ["is_active"])
    op.create_index("idx_prompt_workspace", "knlg_llm_prompt", ["workspace_id"])


def downgrade() -> None:
    """Drop all 17 knlg_* tables (reverse order to respect FK dependencies)."""

    # L4 AI 配置 (3)
    op.drop_table("knlg_llm_prompt")
    op.drop_table("knlg_llm_model")
    op.drop_table("knlg_llm_provider")

    # L3 规则库 (3)
    op.drop_table("knlg_rule_execution")
    op.drop_table("knlg_evidence")
    op.drop_table("knlg_rule")

    # L2 候选 (4)
    op.drop_table("knlg_candidate_kc")
    op.drop_table("knlg_parsed_chunk")
    op.drop_table("knlg_import_job")
    op.drop_table("knlg_document")

    # L2 知识库 (3)
    op.drop_table("knlg_knowledge_card_version")
    op.drop_table("knlg_source_ref")
    op.drop_table("knlg_knowledge_card")

    # L1 问答库 (6)
    op.drop_table("knlg_interview_turn_ref")
    op.drop_table("knlg_interview_turn")
    op.drop_table("knlg_interview")
    op.drop_table("knlg_interview_session")
    op.drop_table("knlg_question")
    op.drop_table("knlg_question_tree")
