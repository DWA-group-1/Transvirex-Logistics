import httpx
from fastapi import FastAPI, HTTPException, Request, Response

app = FastAPI()

SERVICES = {"auth": "http://localhost:8001"}

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
def root():
    return {"status": "ok"}


@app.api_route(
    "/{prefix}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
async def proxy(prefix: str, path: str, request: Request):
    if prefix not in SERVICES:
        raise HTTPException(status_code=404, detail=f"Unknown service: {prefix}")
    target_url = f"{SERVICES[prefix]}/{path}"

    headers = filter_headers(request.headers)

    async with httpx.AsyncClient() as client:
        upstream_response = await client.request(
            method=request.method,
            url=target_url,
            content=await request.body(),
            params=request.query_params,
            headers=headers,
        )

    response_headers = filter_headers(upstream_response.headers)

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )
