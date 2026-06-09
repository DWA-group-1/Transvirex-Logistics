import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from transvirex_common.database import create_session_factory
from transvirex_common.events import EventBus

from . import db
from .config import settings

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    maker = create_session_factory(settings.database_url)
    app.state.db_session_maker = maker
    db.set_session_maker(maker)

    bus = EventBus(settings.redis_url, producer_name="reporting")
    await bus.start()
    app.state.bus = bus

    try:
        yield
    finally:
        await bus.stop()


app = FastAPI(title="Reporting Service", version="1.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}
