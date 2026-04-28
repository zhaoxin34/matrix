"""merge agent_prototype and skill_version migrations

Revision ID: 8221170b9b62
Revises: 007, 007_add_version_and_skill_version
Create Date: 2026-04-28 16:35:40.093655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8221170b9b62'
down_revision: Union[str, None] = ('007', '007_add_version_and_skill_version')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
