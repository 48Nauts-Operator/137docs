"""add missing full_name and role columns to users

Revision ID: 20250523_user_cols
Revises: 2025_05_22_expand_address_book
Create Date: 2025-05-23 00:00:00.000000

This migration patches installations where the ``users`` table was
created before v0.08 and therefore lacks the new ``full_name`` and
``role`` columns required by the authentication logic.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '20250523_user_cols'
down_revision = '2025_05_22_add_settings_table'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite doesn't support IF NOT EXISTS with ADD COLUMN, so we use try/catch
    connection = op.get_bind()
    
    try:
        op.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(100);")
    except Exception:
        # Column probably already exists
        pass
    
    try:
        op.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'viewer';")
    except Exception:
        # Column probably already exists
        pass


def downgrade():
    # SQLite doesn't support DROP COLUMN, so we can't easily remove these columns
    # In practice, this would require recreating the table
    pass 