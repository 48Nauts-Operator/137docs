"""expand address book columns

Revision ID: 2025_05_22_expand_address_book
Revises: 2025_05_21_add_users_table
Create Date: 2025-05-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2025_05_22_expand_address_book'
down_revision = '2025_05_21_add_users_table'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('address_book') as batch:
        batch.add_column(sa.Column('street', sa.String(length=255), nullable=True))
        batch.add_column(sa.Column('address2', sa.String(length=255), nullable=True))
        batch.add_column(sa.Column('town', sa.String(length=255), nullable=True))
        batch.add_column(sa.Column('zip', sa.String(length=20), nullable=True))
        batch.add_column(sa.Column('county', sa.String(length=100), nullable=True))
        batch.add_column(sa.Column('group_name', sa.String(length=100), nullable=True))
        batch.add_column(sa.Column('last_transaction', sa.String(length=50), nullable=True))

def downgrade():
    with op.batch_alter_table('address_book') as batch:
        batch.drop_column('last_transaction')
        batch.drop_column('group_name')
        batch.drop_column('county')
        batch.drop_column('zip')
        batch.drop_column('town')
        batch.drop_column('address2')
        batch.drop_column('street') 