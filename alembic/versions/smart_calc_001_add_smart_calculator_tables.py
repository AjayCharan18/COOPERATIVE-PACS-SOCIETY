"""Add smart calculator tables

Revision ID: smart_calc_001
Revises: 
Create Date: 2025-12-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'smart_calc_001'
down_revision = None  # Update this with your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create loan_ledgers table
    op.create_table(
        'loan_ledgers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('loan_id', sa.Integer(), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('transaction_type', sa.String(50), nullable=False),
        sa.Column('debit_amount', sa.Numeric(15, 2), default=0),
        sa.Column('credit_amount', sa.Numeric(15, 2), default=0),
        sa.Column('balance', sa.Numeric(15, 2), nullable=False),
        sa.Column('reference_type', sa.String(50)),
        sa.Column('reference_id', sa.Integer()),
        sa.Column('description', sa.Text()),
        sa.Column('narration', sa.Text()),
        sa.Column('interest_rate_applied', sa.Numeric(5, 2)),
        sa.Column('days_calculated', sa.Integer()),
        sa.Column('created_by', sa.String(100), default='system'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['loan_id'], ['loans.id']),
    )
    op.create_index('ix_loan_ledgers_loan_id', 'loan_ledgers', ['loan_id'])
    op.create_index('ix_loan_ledgers_transaction_date', 'loan_ledgers', ['transaction_date'])

    # Create accrual_jobs table
    op.create_table(
        'accrual_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_date', sa.Date(), nullable=False),
        sa.Column('job_type', sa.String(50), default='DAILY_ACCRUAL'),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('loans_processed', sa.Integer(), default=0),
        sa.Column('total_accrual_amount', sa.Numeric(15, 2), default=0),
        sa.Column('errors_count', sa.Integer(), default=0),
        sa.Column('error_details', sa.Text()),
        sa.Column('started_at', sa.DateTime()),
        sa.Column('completed_at', sa.DateTime()),
        sa.Column('duration_seconds', sa.Integer()),
        sa.Column('triggered_by', sa.String(100), default='system'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_date'),
    )
    op.create_index('ix_accrual_jobs_job_date', 'accrual_jobs', ['job_date'])

    # Create calculation_cache table
    op.create_table(
        'calculation_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('loan_id', sa.Integer(), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('calculation_type', sa.String(50), nullable=False),
        sa.Column('result_json', sa.Text(), nullable=False),
        sa.Column('cache_hash', sa.String(64)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('accessed_count', sa.Integer(), default=0),
        sa.Column('last_accessed_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['loan_id'], ['loans.id']),
    )
    op.create_index('ix_calculation_cache_loan_id', 'calculation_cache', ['loan_id'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('actor_type', sa.String(20), nullable=False),
        sa.Column('actor_id', sa.Integer()),
        sa.Column('actor_name', sa.String(100)),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50)),
        sa.Column('entity_id', sa.Integer()),
        sa.Column('old_value', sa.Text()),
        sa.Column('new_value', sa.Text()),
        sa.Column('rule_applied', sa.String(100)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(255)),
        sa.Column('description', sa.Text()),
        sa.Column('metadata', sa.Text()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade():
    op.drop_index('ix_audit_logs_created_at', table_name='audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index('ix_calculation_cache_loan_id', table_name='calculation_cache')
    op.drop_table('calculation_cache')
    
    op.drop_index('ix_accrual_jobs_job_date', table_name='accrual_jobs')
    op.drop_table('accrual_jobs')
    
    op.drop_index('ix_loan_ledgers_transaction_date', table_name='loan_ledgers')
    op.drop_index('ix_loan_ledgers_loan_id', table_name='loan_ledgers')
    op.drop_table('loan_ledgers')
