"""add disabled column to users

Revision ID: 20250524_user_disabled
Revises: 20250523_user_cols
Create Date: 2025-05-24 00:00:00.000000
"""
from alembic import op

revision = '20250524_user_disabled'
down_revision = '20250523_user_cols'
branch_labels = None
depends_on = None


def upgrade():
    try:
        op.execute("ALTER TABLE users ADD COLUMN disabled BOOLEAN DEFAULT FALSE;")
    except Exception:
        # Column probably already exists
        pass


def downgrade():
    # SQLite doesn't support DROP COLUMN, so we can't easily remove this column
    pass 