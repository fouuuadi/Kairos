import uuid
from datetime import datetime, date
from sqlalchemy import String, Float, Boolean, ForeignKey, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    stop_loss_pct: Mapped[float] = mapped_column(Float, nullable=False, default=15.0)
    take_profit_pct: Mapped[float] = mapped_column(Float, nullable=False, default=30.0)
    email_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    entries: Mapped[list["Entry"]] = relationship("Entry", back_populates="position", cascade="all, delete-orphan")
    signals: Mapped[list["Signal"]] = relationship("Signal", back_populates="position", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="position", cascade="all, delete-orphan")


class Entry(Base):
    __tablename__ = "entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    position_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("positions.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    position: Mapped["Position"] = relationship("Position", back_populates="entries")
