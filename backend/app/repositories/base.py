from typing import TypeVar, Generic, Optional, List, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: Type[ModelT], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: int) -> Optional[ModelT]:
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 200) -> List[ModelT]:
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, data: dict) -> ModelT:
        obj = self.model(**data)
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, id: int, data: dict) -> Optional[ModelT]:
        data = {k: v for k, v in data.items() if v is not None}
        if not data:
            return await self.get(id)
        await self.db.execute(update(self.model).where(self.model.id == id).values(**data))
        await self.db.flush()
        return await self.get(id)

    async def delete(self, id: int) -> bool:
        result = await self.db.execute(delete(self.model).where(self.model.id == id))
        return result.rowcount > 0
