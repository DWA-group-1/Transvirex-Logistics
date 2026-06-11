from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
import jwt
import asyncio
from collections.abc import AsyncGenerator

from .agent import run_agent
from .schemas import ChatRequest

app = FastAPI(title="AI Agent Service", version="1.0.0")


def identity(
    x_user_id: Annotated[str, Header()],
    x_user_role: Annotated[str, Header()],
    authorization: Annotated[str, Header()],
) -> tuple[str, str, str]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    raw_jwt = authorization.removeprefix("Bearer ").strip()
    return x_user_id, x_user_role, raw_jwt

# ── Chat helper ───────────────────────────────────────────────────────────

async def with_keepalive(
    source: AsyncGenerator[str, None],
    interval: float = 10.0,
) -> AsyncGenerator[str, None]:
    """
    Wrap an SSE async generator and send SSE comments periodically
    while waiting for the next real event.

    SSE comments look like:
      : keep-alive\n\n

    The frontend ignores them, but proxies/gateways see traffic.
    """
    queue: asyncio.Queue[str | None] = asyncio.Queue()

    async def produce() -> None:
        try:
            async for chunk in source:
                await queue.put(chunk)
        finally:
            await queue.put(None)

    producer_task = asyncio.create_task(produce())

    try:
        # Send something immediately so the gateway receives headers/body fast.
        yield ": connected\n\n"

        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=interval)
            except asyncio.TimeoutError:
                yield ": keep-alive\n\n"
                continue

            if item is None:
                break

            yield item

    finally:
        producer_task.cancel()
        try:
            await producer_task
        except asyncio.CancelledError:
            pass

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(body: ChatRequest, request: Request):
    """
    SSE endpoint. Streams tokens as:
      data: {"token": "..."}\n\n
      data: [DONE]\n\n
    """
    user_id, role, raw_jwt = _extract_identity(request)

    agent_stream = run_agent(
        user_message=body.message,
        history=body.history,
        role=role,
        user_id=user_id,
        jwt=raw_jwt,
    )

    return StreamingResponse(
        with_keepalive(agent_stream, interval=5.0),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
