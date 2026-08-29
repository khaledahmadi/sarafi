"""drop_feedback_subject

Revision ID: f9a0b1c2d3e4
Revises: e8f9a0b1c2d3
Create Date: 2026-08-13 23:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9a0b1c2d3e4"
down_revision: Union[str, None] = "e8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("feedbacks", "subject")


def downgrade() -> None:
    op.add_column(
        "feedbacks",
        sa.Column("subject", sa.String(length=120), nullable=False, server_default=""),
    )
    op.alter_column("feedbacks", "subject", server_default=None)
