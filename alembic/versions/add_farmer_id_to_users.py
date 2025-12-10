"""add farmer_id to users

Revision ID: add_farmer_id_001
Revises: 
Create Date: 2025-12-07 16:35:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_farmer_id_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add farmer_id column
    op.add_column('users', sa.Column('farmer_id', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_users_farmer_id'), 'users', ['farmer_id'], unique=True)


def downgrade() -> None:
    # Remove farmer_id column
    op.drop_index(op.f('ix_users_farmer_id'), table_name='users')
    op.drop_column('users', 'farmer_id')
