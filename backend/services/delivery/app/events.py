import asyncio
import json
import logging
import os
import socket
import uuid
from datetime import datetime, timezone
from typing import Awaitable, Callable

import redis.asyncio as redis
from redis.exceptions import ResponseError

logger = logging.getLogger(__name__)

EventHandler = Callable[[dict], Awaitable[None]]


class EventBus:
    def __init__(
        self,
        redis_url: str,
        producer_name: str,
        consumer_group: str | None = None,
        consumer_name: str | None = None,
        block_ms: int = 5000,
        batch_size: int = 10,
    ):
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._producer = producer_name
        self._group = consumer_group or producer_name
        self._consumer = consumer_name or socket.gethostname()
        self._block_ms = block_ms
        self._batch_size = batch_size

        self._handlers: dict[str, list[EventHandler]] = {}
        self._task: asyncio.Task | None = None
        self._stopping = False

    async def publish(self, stream: str, event_type: str, data: dict) -> str:
        enveloppe = {
            "event_id": str(uuid.uuid4()),
            "event_type": event_type,
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "producer": self._producer,
            "event_version": 1,
            "data": data,
        }
        entry_id = await self._redis.xadd(stream, {"enveloppe": json.dumps(enveloppe)})
        logger.info(
            "event published",
            extra={"stream": stream, "event_type": event_type, "entry_id": entry_id},
        )
        return entry_id

    def on(self, stream: str, handler: EventHandler) -> None:
        self._handlers.setdefault(stream, []).append(handler)

    async def start(self) -> None:
        if not self._handlers:
            logger.info("no handlers registeres, skipping start")
            return

        for stream in self._handlers.keys():
            await self._ensure_group(stream)

        self._task = asyncio.create_task(self._read_loop())
        logger.info(
            "event bus started",
            extra={
                "group": self._group,
                "consumer": self._consumer,
                "streams": list(self._handlers.keys()),
            },
        )

    async def stop(self) -> None:
        self._stopping = True
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await self._redis.aclose()
        logger.info("event bus stopped")

    async def _ensure_group(self, stream: str) -> None:
        try:
            await self._redis.xgroup_create(
                name=stream,
                groupname=self._group,
                id="$",
                mkstream=True,
            )
            logger.info(
                "consumer group created",
                extra={"stream": stream, "group": self._group},
            )
        except ResponseError as e:
            if "BUSYGROUP" in str(e):
                pass
            else:
                raise

    async def _read_loop(self) -> None:
        streams = {s: ">" for s in self._handlers.keys()}

        while not self._stopping:
            try:
                response = await self._redis.xreadgroup(
                    groupname=self._group,
                    consumername=self._consumer,
                    streams=streams,
                    count=self._batch_size,
                    block=self._block_ms,
                )
            except Exception:
                logger.exception("xreadgroup failed, retrying in 1s")
                await asyncio.sleep(1)
                continue

            if not response:
                continue

            for stream_name, entries in response:
                for entry_id, fields in entries:
                    await self._dispatch(stream_name, entry_id, fields)

    async def _dispatch(self, stream: str, entry_id: str, fields: dict):
        raw = fields.get("enveloppe")
        if raw is None:
            logger.warning(
                "malformed entry missing 'enveloppe' field, skipping",
                extra={"stream": stream, "entry_id": entry_id},
            )
            await self._redis.xack(stream, self._group, entry_id)
            return

        try:
            enveloppe = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning(
                "event handler failed",
                extra={
                    "stream": stream,
                    "entry_id": entry_id,
                },
            )
            await self._redis.xack(stream, self._group, entry_id)
            return

        all_ok = True
        for handler in self._handlers.get(stream, []):
            try:
                await handler(enveloppe)
            except Exception:
                logger.exception(
                    "event handler failed",
                    extra={
                        "stream": stream,
                        "entry_id": entry_id,
                        "event_type": enveloppe.get("event_type"),
                    },
                )
                all_ok = False

        if all_ok:
            await self._redis.xack(stream, self._group, entry_id)
