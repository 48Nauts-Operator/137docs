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
down_revision = '2025_05_22_expand_address_book'
branch_labels = None
depends_on = None


def upgrade():
    # The IF NOT EXISTS guard ensures idempotency across environments.
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);"
    )
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'viewer';"
    )


def downgrade():
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS full_name;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS role;") 