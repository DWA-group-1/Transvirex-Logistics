from collections.abc import AsyncGenerator

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def create_session_factory(database_url: str) -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(database_url)
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    maker = getattr(request.app.state, "db_session_maker", None)
    if maker is None:
        raise RuntimeError(
            "db_session_maker not set on app.state — wire create_session_factory() in the service lifespan"
        )
    async with maker() as db:
        yield db
