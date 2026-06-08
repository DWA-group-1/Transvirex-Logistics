from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import jwt

from .config import settings
from .agent import run_agent
from .schemas import ChatRequest

app = FastAPI(title="AI Agent Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth helper ───────────────────────────────────────────────────────────────


def _extract_identity(request: Request) -> tuple[str, str, str]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    raw_jwt = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(raw_jwt, settings.public_key, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid or expired token")
    user_id = payload.get("sub", "")
    role = payload.get("role", "")
    if not user_id or not role:
        raise HTTPException(401, "Token missing sub or role claim")
    return user_id, role, raw_jwt


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

    return StreamingResponse(
        run_agent(
            user_message=body.message,
            history=body.history,
            role=role,
            user_id=user_id,
            jwt=raw_jwt,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
