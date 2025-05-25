"""baseline revision for existing schema

Revision ID: 0001_baseline
Revises: 
Create Date: 2025-05-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_baseline'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Schema already managed via SQLAlchemy metadata create_all at startup.
    # This baseline allows Alembic to start tracking without altering the DB.
    pass


def downgrade():
    # Irreversible baseline – no downgrade available.
    pass 