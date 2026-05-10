"""add rsi thresholds to positions

Revision ID: 002
Revises: 001
Create Date: 2026-05-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "positions",
        sa.Column("rsi_buy_threshold", sa.Float, nullable=False, server_default="30.0"),
    )
    op.add_column(
        "positions",
        sa.Column("rsi_sell_threshold", sa.Float, nullable=False, server_default="70.0"),
    )


def downgrade() -> None:
    op.drop_column("positions", "rsi_sell_threshold")
    op.drop_column("positions", "rsi_buy_threshold")
