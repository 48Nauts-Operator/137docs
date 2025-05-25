"""create vectors table for ColPali patch-id mapping

Revision ID: 20250524_vectors
Revises: 20250524_user_disabled
Create Date: 2025-05-24 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '20250524_vectors'
down_revision = '20250524_user_disabled'
branch_labels = None
depends_on = None

def upgrade():
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS vectors (
            id SERIAL PRIMARY KEY,
            doc_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            page INTEGER NOT NULL,
            vector_ids TEXT NOT NULL
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_vectors_doc_id ON vectors(doc_id);")


def downgrade():
    op.execute("DROP TABLE IF EXISTS vectors;") 