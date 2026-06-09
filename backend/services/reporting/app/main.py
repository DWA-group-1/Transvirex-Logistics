import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from transvirex_common.database import create_session_factory
from transvirex_common.events import EventBus

from . import db, handlers
from .config import settings
from .routes import kpi as kpi_router

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    maker = create_session_factory(settings.database_url)
    app.state.db_session_maker = maker
    db.set_session_maker(maker)

    bus = EventBus(settings.redis_url, producer_name="reporting")
    bus.on("delivery.events", handlers.on_delivery_event)
    bus.on("catalog.events", handlers.on_catalog_event)
    bus.on("billing.events", handlers.on_billing_event)
    await bus.start()
    app.state.bus = bus

    try:
        yield
    finally:
        await bus.stop()


app = FastAPI(title="Reporting Service", version="1.0", lifespan=lifespan)
app.include_router(kpi_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
