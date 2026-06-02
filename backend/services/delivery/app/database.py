from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url)
SessionMaker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with SessionMaker() as db:
        yield db
