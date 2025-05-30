"""add processing_rules table for document automation

Revision ID: 20250530_processing_rules
Revises: 20250528_tenant_profile
Create Date: 2025-05-30
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250530_processing_rules'
down_revision = '20250529_final_cleanup'
branch_labels = None
depends_on = None

def upgrade():
    # Create processing_rules table
    op.create_table(
        'processing_rules',
        sa.Column('id', sa.Integer(), primary_key=True),
        
        # Basic rule identification
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        
        # Rule matching criteria
        sa.Column('vendor', sa.String(length=255), nullable=True),
        sa.Column('preferred_tenant_id', sa.Integer(), sa.ForeignKey('entities.id'), nullable=True),
        
        # Conditions and actions stored as JSON
        sa.Column('conditions', sa.Text(), nullable=False),  # JSON string
        sa.Column('actions', sa.Text(), nullable=False),     # JSON string
        
        # Rule management
        sa.Column('priority', sa.Integer(), default=0),
        sa.Column('enabled', sa.Boolean(), default=True),
        
        # Usage statistics
        sa.Column('matches_count', sa.Integer(), default=0),
        sa.Column('last_matched_at', sa.DateTime(), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Create indexes for performance
    op.create_index(op.f('ix_processing_rules_id'), 'processing_rules', ['id'])
    op.create_index(op.f('ix_processing_rules_vendor'), 'processing_rules', ['vendor'])
    op.create_index(op.f('ix_processing_rules_priority'), 'processing_rules', ['priority'])
    op.create_index(op.f('ix_processing_rules_enabled'), 'processing_rules', ['enabled'])

def downgrade():
    op.drop_index(op.f('ix_processing_rules_enabled'), table_name='processing_rules')
    op.drop_index(op.f('ix_processing_rules_priority'), table_name='processing_rules')
    op.drop_index(op.f('ix_processing_rules_vendor'), table_name='processing_rules')
    op.drop_index(op.f('ix_processing_rules_id'), table_name='processing_rules')
    op.drop_table('processing_rules') 