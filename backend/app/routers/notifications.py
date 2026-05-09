import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.models.notification import Notification
from app.schemas.signal import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).order_by(Notification.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification).where(Notification.id == notification_id).values(read=True)
    )
    await db.commit()
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    return result.scalar_one()


@router.patch("/read-all", status_code=204)
async def mark_all_read(db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).values(read=True))
    await db.commit()
