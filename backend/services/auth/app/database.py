from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base

from .config import settings

engine = create_async_engine(settings.database_url)

SessionMaker = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with SessionMaker() as db:
        yield db
