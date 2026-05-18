import httpx
from fastapi import FastAPI, Response

app = FastAPI()

AUTH_URL = "http://localhost:8001"


@app.get("/health")
def root():
    return {"status": "ok"}


@app.get("/auth/{path:path}")
async def proxy_auth(path: str):
    async with httpx.AsyncClient() as client:
        upstream_response = await client.get(f"{AUTH_URL}/{path}")
    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
    )
