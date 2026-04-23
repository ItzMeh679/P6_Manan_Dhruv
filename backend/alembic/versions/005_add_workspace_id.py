"""add_workspace_id_to_cloud_connections

Revision ID: 005
Revises: 004
Create Date: 2026-04-23 08:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cloud_connections', sa.Column('workspace_id', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('cloud_connections', 'workspace_id')
