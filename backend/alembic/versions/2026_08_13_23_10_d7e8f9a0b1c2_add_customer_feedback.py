"""add_customer_feedback

Revision ID: d7e8f9a0b1c2
Revises: 88236b3a72b1
Create Date: 2026-08-13 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, None] = "88236b3a72b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

feedback_status_enum = postgresql.ENUM(
    "pending",
    "reviewed",
    name="feedback_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute(
        "DO $$ BEGIN CREATE TYPE feedback_status AS ENUM "
        "('pending', 'reviewed'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("subject", sa.String(length=120), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("status", feedback_status_enum, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_feedbacks_user_id"), "feedbacks", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_feedbacks_user_id"), table_name="feedbacks")
    op.drop_table("feedbacks")
    op.execute("DROP TYPE IF EXISTS feedback_status")
