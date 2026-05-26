import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

app = FastAPI(title="Catalog Service", version="1.0")


@app.get("/health")
def health():
    return {"status": "ok"}
