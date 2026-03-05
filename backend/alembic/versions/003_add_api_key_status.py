"""add_api_key_and_status_to_log_sources

Revision ID: 003
Revises: 002
Create Date: 2026-03-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def generate_api_key():
    return f"ps_{uuid.uuid4().hex}"


def upgrade() -> None:
    # Add api_key column (nullable first, then backfill, then make non-nullable)
    op.add_column('log_sources', sa.Column('api_key', sa.String(), nullable=True))
    op.add_column('log_sources', sa.Column('status', sa.String(), nullable=True, server_default='waiting'))

    # Backfill existing rows with unique API keys
    conn = op.get_bind()
    sources = conn.execute(sa.text("SELECT id FROM log_sources")).fetchall()
    for source in sources:
        api_key = generate_api_key()
        conn.execute(
            sa.text("UPDATE log_sources SET api_key = :key, status = 'connected' WHERE id = :id"),
            {"key": api_key, "id": source[0]}
        )

    # Make api_key non-nullable and unique
    op.alter_column('log_sources', 'api_key', nullable=False)
    op.create_unique_constraint('uq_log_sources_api_key', 'log_sources', ['api_key'])


def downgrade() -> None:
    op.drop_constraint('uq_log_sources_api_key', 'log_sources', type_='unique')
    op.drop_column('log_sources', 'status')
    op.drop_column('log_sources', 'api_key')
