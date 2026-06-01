"""Initial migration — create all tables

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="viewer"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "machines",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("model_number", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_machines_id", "machines", ["id"])

    op.create_table(
        "labour",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("cnic", sa.String(20), nullable=True),
        sa.Column("monthly_salary", sa.Numeric(12, 2), nullable=False),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_labour_id", "labour", ["id"])

    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_clients_id", "clients", ["id"])

    op.create_table(
        "raw_materials",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("current_stock", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("cost_per_unit", sa.Numeric(12, 2), nullable=False),
        sa.Column("minimum_stock_alert", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_raw_materials_id", "raw_materials", ["id"])

    op.create_table(
        "shifts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("machine_id", sa.Integer(), sa.ForeignKey("machines.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("labour_id", sa.Integer(), sa.ForeignKey("labour.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("shift_type", sa.String(10), nullable=False),
        sa.Column("stitch_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_shifts_id", "shifts", ["id"])
    op.create_index("ix_shifts_date", "shifts", ["date"])
    op.create_index("ix_shifts_machine_id", "shifts", ["machine_id"])
    op.create_index("ix_shifts_labour_id", "shifts", ["labour_id"])

    op.create_table(
        "advances",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("labour_id", sa.Integer(), sa.ForeignKey("labour.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_advances_id", "advances", ["id"])
    op.create_index("ix_advances_labour_id", "advances", ["labour_id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("machine_id", sa.Integer(), sa.ForeignKey("machines.id", ondelete="SET NULL"), nullable=True),
        sa.Column("design_name", sa.String(255), nullable=False),
        sa.Column("order_type", sa.String(20), nullable=False),
        sa.Column("estimated_stitches", sa.BigInteger(), nullable=True),
        sa.Column("actual_stitches", sa.BigInteger(), nullable=True),
        sa.Column("rate_per_stitch", sa.Numeric(10, 4), nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("advance_payment", sa.Numeric(12, 2), nullable=True, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("order_date", sa.Date(), nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_orders_id", "orders", ["id"])
    op.create_index("ix_orders_client_id", "orders", ["client_id"])

    op.create_table(
        "material_usages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("raw_materials.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("quantity_used", sa.Numeric(12, 3), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_material_usages_id", "material_usages", ["id"])
    op.create_index("ix_material_usages_order_id", "material_usages", ["order_id"])

    op.create_table(
        "daily_expenses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_daily_expenses_id", "daily_expenses", ["id"])
    op.create_index("ix_daily_expenses_date", "daily_expenses", ["date"])

    op.create_table(
        "maintenance_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("machine_id", sa.Integer(), sa.ForeignKey("machines.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_maintenance_logs_id", "maintenance_logs", ["id"])
    op.create_index("ix_maintenance_logs_machine_id", "maintenance_logs", ["machine_id"])

    op.create_table(
        "report_configs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("recipient_emails", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("send_day", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("send_time", sa.String(5), nullable=False, server_default="08:00"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_report_configs_id", "report_configs", ["id"])

    # Seed admin user (password: Admin@123)
    op.execute(
        "INSERT INTO users (name, email, hashed_password, role, is_active) "
        "VALUES ('Admin', 'admin@embroidery.com', "
        "'$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', "
        "'admin', true)"
    )


def downgrade() -> None:
    op.drop_table("report_configs")
    op.drop_table("maintenance_logs")
    op.drop_table("daily_expenses")
    op.drop_table("material_usages")
    op.drop_table("orders")
    op.drop_table("advances")
    op.drop_table("shifts")
    op.drop_table("raw_materials")
    op.drop_table("clients")
    op.drop_table("labour")
    op.drop_table("machines")
    op.drop_table("users")
