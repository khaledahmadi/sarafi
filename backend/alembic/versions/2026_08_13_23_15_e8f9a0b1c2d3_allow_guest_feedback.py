"""allow_guest_feedback

Revision ID: e8f9a0b1c2d3
Revises: d7e8f9a0b1c2
Create Date: 2026-08-13 23:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feedbacks", sa.Column("guest_name", sa.String(length=120), nullable=True))
    op.add_column("feedbacks", sa.Column("guest_email", sa.String(length=255), nullable=True))
    op.alter_column("feedbacks", "user_id", existing_type=sa.Uuid(), nullable=True)
    op.drop_constraint("feedbacks_user_id_fkey", "feedbacks", type_="foreignkey")
    op.create_foreign_key(
        "feedbacks_user_id_fkey",
        "feedbacks",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("feedbacks_user_id_fkey", "feedbacks", type_="foreignkey")
    op.create_foreign_key(
        "feedbacks_user_id_fkey",
        "feedbacks",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.alter_column("feedbacks", "user_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_column("feedbacks", "guest_email")
    op.drop_column("feedbacks", "guest_name")
