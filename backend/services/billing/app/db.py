"""
Module-level session holder.

Set once in lifespan via `SessionMaker = create_session_factory(url)`.
Event handlers import this module and call `db.SessionMaker()`.
This avoids the UnboundLocalError that arises from writing
`async with db.SessionMaker() as db:` inside a handler.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

# Populated in app.main lifespan
SessionMaker: async_sessionmaker[AsyncSession] | None = None
