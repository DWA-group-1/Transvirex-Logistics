from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

SessionMaker: async_sessionmaker[AsyncSession] | None = None


def set_session_maker(maker: async_sessionmaker[AsyncSession]) -> None:
    global SessionMaker
    SessionMaker = maker
