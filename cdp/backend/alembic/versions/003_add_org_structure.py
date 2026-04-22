"""Add org structure tables

Revision ID: 003
Revises: 002
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. organization_unit
    op.create_table(
        'organization_unit',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('type', sa.Enum('company', 'branch', 'department', 'sub_department', name='org_unit_type'), nullable=False),
        sa.Column('parent_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id'), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('active', 'inactive', name='org_unit_status'), nullable=False, server_default='active'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('leader_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_org_unit_code', 'organization_unit', ['code'], unique=True)
    op.create_index('ix_org_unit_parent_id', 'organization_unit', ['parent_id'])

    # 2. org_unit_closure
    op.create_table(
        'org_unit_closure',
        sa.Column('ancestor_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id', ondelete='CASCADE'), nullable=False),
        sa.Column('descendant_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id', ondelete='CASCADE'), nullable=False),
        sa.Column('depth', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('ancestor_id', 'descendant_id'),
    )
    op.create_index('ix_org_unit_closure_descendant', 'org_unit_closure', ['descendant_id'])

    # 3. employee
    op.create_table(
        'employee',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('employee_no', sa.String(50), nullable=False, unique=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(100), nullable=True),
        sa.Column('position', sa.String(100), nullable=True),
        sa.Column('primary_unit_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id'), nullable=True),
        sa.Column('status', sa.Enum('onboarding', 'on_job', 'transferring', 'offboarding', name='employee_status'), nullable=False, server_default='onboarding'),
        sa.Column('entry_date', sa.Date(), nullable=True),
        sa.Column('dimission_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_employee_no', 'employee', ['employee_no'], unique=True)
    op.create_index('ix_employee_primary_unit', 'employee', ['primary_unit_id'])

    # 4. employee_secondary_unit
    op.create_table(
        'employee_secondary_unit',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('employee_id', sa.BigInteger(), sa.ForeignKey('employee.id', ondelete='CASCADE'), nullable=False),
        sa.Column('unit_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint('employee_id', 'unit_id', name='uq_employee_secondary_unit'),
    )

    # 5. employee_transfer
    op.create_table(
        'employee_transfer',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('employee_id', sa.BigInteger(), sa.ForeignKey('employee.id', ondelete='CASCADE'), nullable=False),
        sa.Column('from_unit_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id'), nullable=True),
        sa.Column('to_unit_id', sa.BigInteger(), sa.ForeignKey('organization_unit.id'), nullable=False),
        sa.Column('transfer_type', sa.Enum('promotion', 'demotion', 'transfer', name='transfer_type'), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_employee_transfer_employee', 'employee_transfer', ['employee_id'])

    # 6. user_employee_mapping
    op.create_table(
        'user_employee_mapping',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('employee_id', sa.BigInteger(), sa.ForeignKey('employee.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )


def downgrade() -> None:
    op.drop_table('user_employee_mapping')
    op.drop_table('employee_transfer')
    op.drop_table('employee_secondary_unit')
    op.drop_table('employee')
    op.drop_table('org_unit_closure')
    op.drop_table('organization_unit')
    # Drop enums
    sa.Enum(name='transfer_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='employee_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='org_unit_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='org_unit_type').drop(op.get_bind(), checkfirst=True)
