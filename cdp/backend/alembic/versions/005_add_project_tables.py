"""Add project tables

Revision ID: 005
Revises: 004
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create project table
    op.create_table(
        'project',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('code', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('active', 'inactive', 'archived', name='project_status'), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_project_code', 'project', ['code'], unique=True)
    op.create_index('ix_project_status', 'project', ['status'])

    # Create project_member table
    op.create_table(
        'project_member',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('role', sa.Enum('admin', 'member', name='project_member_role'), nullable=False, server_default='member'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_project_member_project_user', 'project_member', ['project_id', 'user_id'], unique=True)

    # Create org_project table
    op.create_table(
        'org_project',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('org_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('project_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['org_id'], ['organization_unit.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_org_project_org_project', 'org_project', ['org_id', 'project_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_org_project_org_project', table_name='org_project')
    op.drop_table('org_project')
    op.drop_index('ix_project_member_project_user', table_name='project_member')
    op.drop_table('project_member')
    op.drop_index('ix_project_status', table_name='project')
    op.drop_index('ix_project_code', table_name='project')
    op.drop_table('project')
    sa.Enum(name='project_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='project_member_role').drop(op.get_bind(), checkfirst=True)