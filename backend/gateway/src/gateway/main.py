from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request, Response

from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0))
    yield
    await app.state.http_client.aclose()


app = FastAPI(lifespan=lifespan)

SERVICES = {"auth": settings.auth_url}

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


def filter_headers(headers):
    return {k: v for k, v in headers.items() if k.lower() not in HOP_BY_HOP}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.api_route(
    "/{prefix}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
async def proxy(prefix: str, path: str, request: Request):
    if prefix not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Unknown service: {prefix}")
    target_url = f"{SERVICES[prefix]}/{path}"
    headers = filter_headers(request.headers)
    client = request.app.state.http_client

    try:
        upstream_response = await client.request(
            method=request.method,
            url=target_url,
            content=await request.body(),
            params=request.query_params,
            headers=headers,
        )
    except httpx.ConnectError:
        raise HTTPException(502, "Upstream service unreachable")
    except httpx.TimeoutException:
        raise HTTPException(504, "Upstream service timed out")
    except httpx.RequestError as e:
        raise HTTPException(502, f"Upstream error: {type(e).__name__}")

    response_headers = filter_headers(upstream_response.headers)

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )
