"""add rate_source to currencies

Revision ID: b7c8d9e0f1a2
Revises: a0b1c2d3e4f5
Create Date: 2026-09-01 23:45:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "a0b1c2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "currencies",
        sa.Column("rate_source", sa.String(length=32), nullable=False, server_default="sarai_shahzada"),
    )
    op.drop_index("ix_currencies_code", table_name="currencies")
    op.create_index("ix_currencies_code", "currencies", ["code"], unique=False)
    op.create_index(
        "uq_currencies_rate_source_code",
        "currencies",
        ["rate_source", "code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_currencies_rate_source_code", table_name="currencies")
    op.drop_index("ix_currencies_code", table_name="currencies")
    op.create_index("ix_currencies_code", "currencies", ["code"], unique=True)
    op.drop_column("currencies", "rate_source")
