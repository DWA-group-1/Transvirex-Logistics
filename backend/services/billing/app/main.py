import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import db as db_holder
from app.config import settings
from app.routes.invoices import router as invoices_router
from transvirex_common.database import create_session_factory
from transvirex_common.events import EventBus

log = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.events import (
        on_customer_created,
        on_customer_updated,
        on_delivery_cancelled,
        on_delivery_completed,
        on_delivery_created,
    )

    db_holder.SessionMaker = create_session_factory(settings.database_url)

    bus = EventBus(settings.redis_url, producer_name="billing")

    async def handle_delivery_event(event: dict) -> None:
        event_type = event.get("event_type")
        payload = event.get("data", {})

        if event_type == "delivery.created":
            await on_delivery_created(payload)
        elif event_type == "delivery.completed":
            await on_delivery_completed(payload)
        elif event_type == "delivery.cancelled":
            await on_delivery_cancelled(payload)
        else:
            log.debug("Ignoring delivery event: %s", event_type)

    async def handle_catalog_event(event: dict) -> None:
        event_type = event.get("event_type")
        payload = event.get("data", {})

        if event_type == "customer.created":
            await on_customer_created(payload)
        elif event_type == "customer.updated":
            await on_customer_updated(payload)
        else:
            log.debug("Ignoring catalog event: %s", event_type)

    bus.on("delivery.events", handle_delivery_event)
    bus.on("catalog.events", handle_catalog_event)

    await bus.start()
    app.state.bus = bus

    log.info("Billing service started")

    yield

    await app.state.bus.stop()
    log.info("Billing service stopped")


app = FastAPI(
    title="Billing Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(invoices_router)


@app.get("/health")
def health():
    return {"status": "ok"}