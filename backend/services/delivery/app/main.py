import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from transvirex_common.database import create_session_factory
from transvirex_common.events import EventBus

from . import clients, db
from .config import settings
from .routes import deliveries as deliveries_router
from .routes import incidents as incidents_router
from .routes import tracking as tracking_router

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    maker = create_session_factory(settings.database_url)
    app.state.db_session_maker = maker
    db.set_session_maker(maker)
    bus = EventBus(settings.redis_url, producer_name="delivery")
    await bus.start()
    app.state.bus = bus
    clients.catalog_client = clients.CatalogClient()

    try:
        yield
    finally:
        await bus.stop()
        if clients.catalog_client is not None:
            await clients.catalog_client.close()


app = FastAPI(title="Delivery Service", version="1.0", lifespan=lifespan)
app.include_router(deliveries_router.router)
app.include_router(tracking_router.router)
app.include_router(incidents_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
