import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings
from .events import EventBus

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    bus = EventBus(settings.redis_url, producer_name="catalog")
    await bus.start()
    app.state.bus = bus
    try:
        yield
    finally:
        await bus.stop()


app = FastAPI(title="Catalog Service", version="1.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}
