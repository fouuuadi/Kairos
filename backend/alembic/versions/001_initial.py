"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "positions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ticker", sa.String(20), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("stop_loss_pct", sa.Float, nullable=False, server_default="15.0"),
        sa.Column("take_profit_pct", sa.Float, nullable=False, server_default="30.0"),
        sa.Column("email_alerts", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "entries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("position_id", UUID(as_uuid=True), sa.ForeignKey("positions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("quantity", sa.Float, nullable=False),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "signals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("position_id", UUID(as_uuid=True), sa.ForeignKey("positions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("signal", sa.String(10), nullable=False),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("rsi", sa.Float, nullable=True),
        sa.Column("above_ma50", sa.Boolean, nullable=True),
        sa.Column("above_ma200", sa.Boolean, nullable=True),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("position_id", UUID(as_uuid=True), sa.ForeignKey("positions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("read", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("signals")
    op.drop_table("entries")
    op.drop_table("positions")
