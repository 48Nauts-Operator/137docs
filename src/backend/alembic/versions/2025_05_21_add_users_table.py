"""add users table

Revision ID: 2025_05_21_add_users_table
Revises: 0001_baseline
Create Date: 2025-05-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '2025_05_21_add_users_table'
down_revision = '0001_baseline'
branch_labels = None
depends_on = None


def upgrade():
    # Use raw SQL so we can utilise IF NOT EXISTS for idempotency.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            full_name VARCHAR(100),
            role VARCHAR(20) NOT NULL DEFAULT 'viewer',
            hashed_password VARCHAR(255) NOT NULL,
            disabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """
    )


def downgrade():
    op.execute("DROP TABLE IF EXISTS users;") 