from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


class Settings(BaseSettings):
    database_url: str


settings = Settings()

engine = create_async_engine(settings.database_url)


SessionMaker = async_sessionmaker(engine, expire_on_commit=False)


async def get_session():
    async with SessionMaker() as session:
        yield session
