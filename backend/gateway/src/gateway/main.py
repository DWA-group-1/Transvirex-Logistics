import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
import websockets
from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    Response,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState

from .auth import extract_token, verify_jwt
from .config import settings
from .middleware import AccessLogMiddleware, RequestIDMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0))
    yield
    await app.state.http_client.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AccessLogMiddleware)
app.add_middleware(RequestIDMiddleware)

SERVICES = {
    "auth": settings.auth_url,
    "notification": settings.notif_url,
    "catalog": settings.catalog_url,
    "delivery": settings.delivery_url,
    "billing": settings.billing_url,
    "reporting": settings.reporting_url,
    "ai-agent": settings.ai_agent_url,
}

HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}

PUBLIC_PREFIXES = {
    "auth/token",
    "auth/token/refresh",
    "auth/token/revoke",
}

IDENTITY_HEADERS = {
    "x-user-id",
    "x-user-role",
    "x-user-email",
}


def is_public_route(prefix: str, path: str) -> bool:
    full_path = f"{prefix}/{path}"

    if full_path in PUBLIC_PREFIXES:
        return True

    # allow all service health checks without JWT
    if path == "health":
        return True

    return False


def _ws_target_url(prefix: str, path: str, query: str) -> str:
    base = SERVICES[prefix].replace("http://", "ws://").replace("https://", "wss://")

    url = f"{base}/{path}"

    if query:
        url = f"{url}?{query}"

    return url


async def _pump(client: WebSocket, upstream) -> None:
    async def client_to_upstream():
        try:
            while True:
                msg = await client.receive_text()
                await upstream.send(msg)
        except WebSocketDisconnect:
            await upstream.close()
        except Exception:
            await upstream.close()

    async def upstream_to_client():
        try:
            async for msg in upstream:
                await client.send_text(msg)
        except Exception:
            pass
        finally:
            if client.client_state != WebSocketState.DISCONNECTED:
                await client.close()

    await asyncio.gather(
        client_to_upstream(),
        upstream_to_client(),
    )


def filter_headers(headers):
    return {
        k: v
        for k, v in headers.items()
        if k.lower() not in HOP_BY_HOP and k.lower() not in IDENTITY_HEADERS
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.api_route(
    "/{prefix}/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def proxy(prefix: str, path: str, request: Request):
    if prefix not in SERVICES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown service: {prefix}",
        )

    claims = None
    client = request.app.state.http_client

    if not is_public_route(prefix, path):
        token = extract_token(request.headers.get("Authorization"))
        claims = verify_jwt(token)

    target_url = f"{SERVICES[prefix]}/{path}"

    headers = filter_headers(request.headers)
    headers["X-Request-Id"] = request.state.request_id

    if claims:
        headers["X-User-Id"] = str(claims.get("sub", ""))
        headers["X-User-Role"] = claims.get("role", "")
        headers["X-User-Email"] = claims.get("email", "")

    try:
        upstream_response = await client.request(
            method=request.method,
            url=target_url,
            content=await request.body(),
            params=request.query_params,
            headers=headers,
        )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=502,
            detail="Upstream service unreachable",
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Upstream service timed out",
        )

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream error: {type(e).__name__}",
        )

    response_headers = filter_headers(upstream_response.headers)

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )


@app.websocket("/{prefix}/{path:path}")
async def proxy_ws(
    websocket: WebSocket,
    prefix: str,
    path: str,
):
    if prefix not in SERVICES:
        await websocket.close(code=4404)
        return

    await websocket.accept()

    query = websocket.url.query
    target = _ws_target_url(prefix, path, query)

    try:
        async with websockets.connect(target) as upstream:
            await _pump(websocket, upstream)

    except Exception as e:
        logging.getLogger("gateway.ws").warning(
            "ws proxy error to %s: %s",
            target,
            e,
        )

        if websocket.client_state != WebSocketState.DISCONNECTED:
            await websocket.close(code=1011)
