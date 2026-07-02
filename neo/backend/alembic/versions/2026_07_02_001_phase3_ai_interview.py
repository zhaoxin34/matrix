"""Phase 3 AI Interview tables + knlg_interview_session extension.

Revision ID: 2026_07_02_001
Revises: 2026_07_01_004
Create Date: 2026-07-02

Phase 3 adds:
1. Extend knlg_interview_session with 8 AI-specific columns + 2 indexes
2. CREATE knlg_interview_ai_turn (with FULLTEXT ngram)
3. CREATE knlg_signal
4. CREATE knlg_prompt_version_snapshot
"""

from alembic import op

revision = "2026_07_02_001"
down_revision = "2026_07_01_004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Extend knlg_interview_session
    op.execute("""
        ALTER TABLE knlg_interview_session
            ADD COLUMN tree_id BIGINT NULL,
            ADD COLUMN waiting_reason VARCHAR(255) NULL,
            ADD COLUMN current_turn_index INT NOT NULL DEFAULT 0,
            ADD COLUMN max_turns INT NOT NULL DEFAULT 8,
            ADD COLUMN last_event_id VARCHAR(64) NULL,
            ADD COLUMN started_at DATETIME NULL,
            ADD COLUMN ended_at DATETIME NULL,
            ADD COLUMN summary TEXT NULL
    """)
    op.execute("""
        ALTER TABLE knlg_interview_session
            ADD CONSTRAINT fk_session_tree
                FOREIGN KEY (tree_id) REFERENCES knlg_question_tree(id) ON DELETE SET NULL,
            ADD INDEX idx_session_mode_status (mode, status),
            ADD INDEX idx_session_tree (tree_id)
    """)

    # 2. knlg_interview_ai_turn
    op.execute("""
        CREATE TABLE knlg_interview_ai_turn (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            session_id BIGINT NOT NULL,
            turn_index INT NOT NULL,
            user_question_text TEXT NOT NULL,
            user_question_id BIGINT NULL,
            expert_answer_text TEXT NULL,
            ai_response_text TEXT NULL,
            ai_response_streaming BOOLEAN NOT NULL DEFAULT TRUE,
            next_question_reason VARCHAR(64) NULL,
            followup_turn_id BIGINT NULL,
            llm_request_log JSON NULL,
            prompt_id BIGINT NULL,
            prompt_version VARCHAR(32) NULL,
            model_id BIGINT NULL,
            tokens_used INT NOT NULL DEFAULT 0,
            cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
            duration_ms INT NOT NULL DEFAULT 0,
            ttft_ms INT NULL,
            started_at DATETIME NOT NULL,
            completed_at DATETIME NULL,
            workspace_id BIGINT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES knlg_interview_session(id) ON DELETE CASCADE,
            FOREIGN KEY (user_question_id) REFERENCES knlg_question(id),
            FOREIGN KEY (followup_turn_id) REFERENCES knlg_interview_ai_turn(id),
            FOREIGN KEY (prompt_id) REFERENCES knlg_llm_prompt(id),
            FOREIGN KEY (model_id) REFERENCES knlg_llm_model(id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            UNIQUE KEY uk_session_turn (session_id, turn_index),
            INDEX idx_ai_turn_streaming (ai_response_streaming),
            INDEX idx_ai_turn_workspace (workspace_id),
            INDEX idx_ai_turn_completed (completed_at),
            FULLTEXT INDEX ft_ai_turn_text (user_question_text, expert_answer_text) WITH PARSER ngram
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 3. knlg_signal
    op.execute("""
        CREATE TABLE knlg_signal (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            session_id BIGINT NOT NULL,
            source_turn_id BIGINT NULL,
            type VARCHAR(32) NOT NULL,
            confidence FLOAT NOT NULL,
            text TEXT NOT NULL,
            linked_question_id BIGINT NULL,
            metadata JSON NULL,
            workspace_id BIGINT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES knlg_interview_session(id) ON DELETE CASCADE,
            FOREIGN KEY (source_turn_id) REFERENCES knlg_interview_ai_turn(id) ON DELETE SET NULL,
            FOREIGN KEY (linked_question_id) REFERENCES knlg_question(id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            INDEX idx_signal_session (session_id),
            INDEX idx_signal_type (type),
            INDEX idx_signal_confidence (confidence),
            INDEX idx_signal_workspace (workspace_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 4. knlg_prompt_version_snapshot
    op.execute("""
        CREATE TABLE knlg_prompt_version_snapshot (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            prompt_id BIGINT NOT NULL,
            prompt_version VARCHAR(32) NOT NULL,
            rendered_text TEXT NOT NULL,
            variables_json JSON NOT NULL,
            used_at TIMESTAMP NOT NULL,
            workspace_id BIGINT NOT NULL,
            FOREIGN KEY (prompt_id) REFERENCES knlg_llm_prompt(id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            INDEX idx_snapshot_prompt (prompt_id, prompt_version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS knlg_prompt_version_snapshot")
    op.execute("DROP TABLE IF EXISTS knlg_signal")
    op.execute("DROP TABLE IF EXISTS knlg_interview_ai_turn")
    op.execute("""
        ALTER TABLE knlg_interview_session
            DROP INDEX idx_session_tree,
            DROP INDEX idx_session_mode_status,
            DROP FOREIGN KEY fk_session_tree,
            DROP COLUMN summary,
            DROP COLUMN ended_at,
            DROP COLUMN started_at,
            DROP COLUMN last_event_id,
            DROP COLUMN max_turns,
            DROP COLUMN current_turn_index,
            DROP COLUMN waiting_reason,
            DROP COLUMN tree_id
    """)
