"""add_cloud_connections_table

Revision ID: 004
Revises: 003
Create Date: 2026-04-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'cloud_connections',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('owner_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_cloud_connections_id', 'cloud_connections', ['id'])
    op.create_index('ix_cloud_connections_owner_provider', 'cloud_connections', ['owner_id', 'provider'])


def downgrade() -> None:
    op.drop_index('ix_cloud_connections_owner_provider', table_name='cloud_connections')
    op.drop_index('ix_cloud_connections_id', table_name='cloud_connections')
    op.drop_table('cloud_connections')
