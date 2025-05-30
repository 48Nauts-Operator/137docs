"""Add tenant profile fields to Entity model

Revision ID: 20250528_tenant_profile
Revises: 20250525_llm_config
Create Date: 2025-05-28

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250528_tenant_profile'
down_revision = '20250525_llm_config'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to entities table
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('alias', sa.String(length=100), nullable=False, server_default='Default'))
        batch_op.add_column(sa.Column('street', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('house_number', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('apartment', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('area_code', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('county', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('country', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')))

    # Add new column to user_entities table
    with op.batch_alter_table('user_entities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_default', sa.Boolean(), nullable=True, server_default='false'))


def downgrade():
    # Remove columns from user_entities table
    with op.batch_alter_table('user_entities', schema=None) as batch_op:
        batch_op.drop_column('is_default')

    # Remove columns from entities table
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('is_active')
        batch_op.drop_column('country')
        batch_op.drop_column('county')
        batch_op.drop_column('area_code')
        batch_op.drop_column('apartment')
        batch_op.drop_column('house_number')
        batch_op.drop_column('street')
        batch_op.drop_column('alias') 