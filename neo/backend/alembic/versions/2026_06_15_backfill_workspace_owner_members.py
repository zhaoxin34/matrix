"""backfill workspace owner members

Revision ID: 8a1f3c5d2b4e
Revises: 36997c8878bf
Create Date: 2026-06-15 23:00:00.000000

一次性数据修复: 扫描所有 workspaces, 给 owner 自动补 workspace_members 记录
(如果缺失), 避免 agent-steer 上传时遇到 403 Not a workspace member。

详见 OpenSpec change: agent-steer-upload-backend-integration (Task 6.1)
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8a1f3c5d2b4e"
down_revision: Union[str, None] = "36997c8878bf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """扫描所有 workspaces, 给缺失的 owner 添加 workspace_members 记录。"""
    # INSERT ... SELECT: 给所有还没有 owner member 记录的 workspace 自动补
    op.execute(
        """
        INSERT INTO workspace_members (workspace_id, user_id, role, created_at, updated_at)
        SELECT w.id, w.owner_id, 'OWNER', NOW(), NOW()
        FROM workspaces w
        LEFT JOIN workspace_members wm
          ON wm.workspace_id = w.id AND wm.user_id = w.owner_id
        WHERE wm.id IS NULL
        """
    )


def downgrade() -> None:
    """回滚: 删除所有 owner role 的 workspace_members (谨慎使用)"""
    op.execute("DELETE FROM workspace_members WHERE role = 'OWNER'")
