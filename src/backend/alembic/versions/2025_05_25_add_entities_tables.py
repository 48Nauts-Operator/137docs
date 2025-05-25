"""add entities tables and columns

Revision ID: 20250525_entities
Revises: 20250524_vectors
Create Date: 2025-05-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250525_entities'
down_revision = '20250524_vectors'
branch_labels = None
depends_on = None

def upgrade():
    # entities table
    op.create_table(
        'entities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=20), server_default='company'),
        sa.Column('address_json', sa.Text(), nullable=True),
        sa.Column('vat_id', sa.String(length=50), nullable=True),
        sa.Column('iban', sa.String(length=50), nullable=True),
        sa.Column('aliases', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # user_entities link table
    op.create_table(
        'user_entities',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('entity_id', sa.Integer(), sa.ForeignKey('entities.id'), primary_key=True),
        sa.Column('role', sa.String(length=20), server_default='owner'),
    )

    # Add entity_id to documents
    op.add_column('documents', sa.Column('entity_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_documents_entity_id'), 'documents', ['entity_id'])
    op.create_foreign_key(None, 'documents', 'entities', ['entity_id'], ['id'])

    # Add tos_accepted_at to settings
    op.add_column('settings', sa.Column('tos_accepted_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('settings', 'tos_accepted_at')
    op.drop_constraint(None, 'documents', type_='foreignkey')
    op.drop_index(op.f('ix_documents_entity_id'), table_name='documents')
    op.drop_column('documents', 'entity_id')
    op.drop_table('user_entities')
    op.drop_table('entities') 