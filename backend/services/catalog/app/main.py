import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from . import clients
from .config import settings
from .events import EventBus
from .routes import customers as customers_router
from .routes import drivers as drivers_routers
from .routes import hubs as hubs_router

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    bus = EventBus(settings.redis_url, producer_name="catalog")
    await bus.start()
    app.state.bus = bus

    clients.auth_client = clients.AuthClient()

    try:
        yield
    finally:
        await bus.stop()
        if clients.auth_client is not None:
            await clients.auth_client.close()


app = FastAPI(title="Catalog Service", version="1.0", lifespan=lifespan)
app.include_router(drivers_routers.router)
app.include_router(hubs_router.router)
app.include_router(customers_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
