"""merge heads

Revision ID: 241a25fa9a26
Revises: e3168b84dc2d, create_embedded_sites
Create Date: 2026-05-29 16:25:47.340999

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '241a25fa9a26'
down_revision: Union[str, None] = ('e3168b84dc2d', 'create_embedded_sites')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
