from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"


settings = Settings()

engine = create_async_engine(settings.database_url)
SessionMaker = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with SessionMaker() as db:
        yield db