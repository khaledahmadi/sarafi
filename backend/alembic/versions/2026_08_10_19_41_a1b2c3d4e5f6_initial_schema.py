"""initial_schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-08-10 19:41:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

app_role_enum = postgresql.ENUM(
    "admin",
    "staff",
    "customer",
    name="app_role",
    create_type=False,
)
transfer_status_enum = postgresql.ENUM(
    "pending",
    "in_review",
    "processing",
    "completed",
    "rejected",
    "cancelled",
    name="transfer_status",
    create_type=False,
)


def upgrade() -> None:
    # Create enum types once; columns must use create_type=False so create_table
    # does not attempt to recreate them.
    op.execute(
        "DO $$ BEGIN CREATE TYPE app_role AS ENUM "
        "('admin', 'staff', 'customer'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE transfer_status AS ENUM "
        "('pending', 'in_review', 'processing', 'completed', 'rejected', 'cancelled'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "user_roles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("role", app_role_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role", name="uq_user_roles_user_id_role"),
    )
    op.create_index(op.f("ix_user_roles_user_id"), "user_roles", ["user_id"], unique=False)

    op.create_table(
        "currencies",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=8), nullable=False),
        sa.Column("name_fa", sa.String(length=80), nullable=False),
        sa.Column("flag", sa.String(length=16), nullable=True),
        sa.Column("buy_rate", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("sell_rate", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_currencies_code"), "currencies", ["code"], unique=True)

    op.create_table(
        "services",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title_fa", sa.String(length=120), nullable=False),
        sa.Column("summary_fa", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(length=40), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_services_slug"), "services", ["slug"], unique=True)

    op.create_table(
        "branches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name_fa", sa.String(length=120), nullable=False),
        sa.Column("city_fa", sa.String(length=80), nullable=False),
        sa.Column("country_fa", sa.String(length=80), nullable=False),
        sa.Column("address_fa", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("whatsapp", sa.String(length=30), nullable=True),
        sa.Column("map_url", sa.String(length=500), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "articles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title_fa", sa.String(length=160), nullable=False),
        sa.Column("excerpt_fa", sa.String(length=300), nullable=False),
        sa.Column("body_fa", sa.Text(), nullable=False),
        sa.Column("cover_url", sa.String(length=500), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_articles_slug"), "articles", ["slug"], unique=True)

    op.create_table(
        "transfer_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("reference", sa.String(length=20), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("from_currency", sa.String(length=8), nullable=False),
        sa.Column("to_currency", sa.String(length=8), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("destination_fa", sa.String(length=80), nullable=False),
        sa.Column("recipient_name", sa.String(length=120), nullable=False),
        sa.Column("recipient_detail", sa.String(length=300), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", transfer_status_enum, nullable=False),
        sa.Column("staff_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transfer_requests_reference"), "transfer_requests", ["reference"], unique=True)
    op.create_index(op.f("ix_transfer_requests_user_id"), "transfer_requests", ["user_id"], unique=False)

    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(length=80), nullable=False),
        sa.Column("group_key", sa.String(length=40), nullable=False),
        sa.Column("label_fa", sa.String(length=120), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("input_kind", sa.String(length=40), nullable=False),
        sa.Column("hint_fa", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_index(op.f("ix_site_settings_group_key"), "site_settings", ["group_key"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_site_settings_group_key"), table_name="site_settings")
    op.drop_table("site_settings")

    op.drop_index(op.f("ix_transfer_requests_user_id"), table_name="transfer_requests")
    op.drop_index(op.f("ix_transfer_requests_reference"), table_name="transfer_requests")
    op.drop_table("transfer_requests")

    op.drop_index(op.f("ix_articles_slug"), table_name="articles")
    op.drop_table("articles")

    op.drop_table("branches")

    op.drop_index(op.f("ix_services_slug"), table_name="services")
    op.drop_table("services")

    op.drop_index(op.f("ix_currencies_code"), table_name="currencies")
    op.drop_table("currencies")

    op.drop_index(op.f("ix_user_roles_user_id"), table_name="user_roles")
    op.drop_table("user_roles")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS transfer_status")
    op.execute("DROP TYPE IF EXISTS app_role")
