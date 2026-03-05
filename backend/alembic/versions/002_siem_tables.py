"""siem_tables

Revision ID: 002
Revises: 001
Create Date: 2025-03-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old template table
    op.drop_index(op.f('ix_items_title'), table_name='items')
    op.drop_index(op.f('ix_items_id'), table_name='items')
    op.drop_table('items')

    # Create log_sources table
    op.create_table('log_sources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('cloud_provider', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('owner_id', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(
        'fk_log_sources_owner_id_user', 'log_sources', 'user', ['owner_id'], ['id']
    )
    op.create_index(op.f('ix_log_sources_id'), 'log_sources', ['id'], unique=False)
    op.create_index(op.f('ix_log_sources_cloud_provider'), 'log_sources', ['cloud_provider'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_log_sources_cloud_provider'), table_name='log_sources')
    op.drop_index(op.f('ix_log_sources_id'), table_name='log_sources')
    op.drop_table('log_sources')

    # Recreate old items table
    op.create_table('items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('owner_id', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(
        'fk_items_owner_id_user', 'items', 'user', ['owner_id'], ['id']
    )
    op.create_index(op.f('ix_items_id'), 'items', ['id'], unique=False)
    op.create_index(op.f('ix_items_title'), 'items', ['title'], unique=False)
