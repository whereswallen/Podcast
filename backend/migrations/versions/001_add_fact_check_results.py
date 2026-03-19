"""Add fact_check_results table and brand domain field.

Revision ID: 001_fact_check
Revises: None
Create Date: 2026-03-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_fact_check"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fact_check_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("episode_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("episodes.id"), nullable=False, index=True),
        sa.Column("block_id", sa.String(100), nullable=True),
        sa.Column("claim", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(10), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("suggestion", sa.Text(), nullable=False),
        sa.Column("sources", postgresql.JSON(), nullable=False, server_default="[]"),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("domain", sa.String(30), nullable=True),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.add_column("brand_profiles", sa.Column("domain", sa.String(30), nullable=True, server_default="general"))


def downgrade() -> None:
    op.drop_column("brand_profiles", "domain")
    op.drop_table("fact_check_results")
