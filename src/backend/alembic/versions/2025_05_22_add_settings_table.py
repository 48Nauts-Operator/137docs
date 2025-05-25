"""add settings table

Revision ID: 2025_05_22_add_settings_table
Revises: 2025_05_24_add_vectors_table
Create Date: 2025-05-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2025_05_22_add_settings_table'
# Make sure this matches the latest existing revision in the directory
# (we depend on the vectors table migration dated 24 May).
down_revision = '2025_05_24_add_vectors_table'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            inbox_path VARCHAR(255) NOT NULL,
            storage_root VARCHAR(255) NOT NULL,
            locked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """
    )



def downgrade():
    op.execute("DROP TABLE IF EXISTS settings;") 