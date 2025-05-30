"""add llm_config table for local-first AI integration

Revision ID: 20250525_llm_config
Revises: 20250525_entities
Create Date: 2025-05-25
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250525_llm_config'
down_revision = '20250525_entities'
branch_labels = None
depends_on = None

def upgrade():
    # Create llm_config table
    op.create_table(
        'llm_config',
        sa.Column('id', sa.Integer(), primary_key=True),
        
        # Provider configuration
        sa.Column('provider', sa.String(length=50), server_default='local'),
        sa.Column('api_key', sa.String(length=255), nullable=True),
        sa.Column('api_url', sa.String(length=255), nullable=True),
        
        # Model preferences per task type
        sa.Column('model_tagger', sa.String(length=100), server_default='phi3'),
        sa.Column('model_enricher', sa.String(length=100), server_default='llama3'),
        sa.Column('model_analytics', sa.String(length=100), server_default='llama3'),
        sa.Column('model_responder', sa.String(length=100), nullable=True),
        
        # Processing configuration
        sa.Column('enabled', sa.Boolean(), server_default='false'),
        sa.Column('auto_tagging', sa.Boolean(), server_default='true'),
        sa.Column('auto_enrichment', sa.Boolean(), server_default='true'),
        sa.Column('external_enrichment', sa.Boolean(), server_default='false'),
        
        # Reliability settings
        sa.Column('max_retries', sa.Integer(), server_default='3'),
        sa.Column('retry_delay', sa.Integer(), server_default='300'),
        sa.Column('backup_provider', sa.String(length=50), nullable=True),
        sa.Column('backup_model', sa.String(length=100), nullable=True),
        
        # Performance settings
        sa.Column('batch_size', sa.Integer(), server_default='5'),
        sa.Column('concurrent_tasks', sa.Integer(), server_default='2'),
        sa.Column('cache_responses', sa.Boolean(), server_default='true'),
        
        # Confidence thresholds
        sa.Column('min_confidence_tagging', sa.Float(), server_default='0.7'),
        sa.Column('min_confidence_entity', sa.Float(), server_default='0.8'),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Create index on id (primary key index is automatic, but explicit for clarity)
    op.create_index(op.f('ix_llm_config_id'), 'llm_config', ['id'])

def downgrade():
    op.drop_index(op.f('ix_llm_config_id'), table_name='llm_config')
    op.drop_table('llm_config') 