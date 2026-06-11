from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse

from .agent import run_agent
from .schemas import ChatRequest

app = FastAPI(title="AI Agent Service", version="1.0.0")


# ── Identity ──────────────────────────────────────────────────────────────────
# The gateway already verified the JWT and injected these headers. We only read
# them. The raw bearer token is forwarded to downstream tool calls, where the
# gateway verifies it again — the agent itself never decodes or trusts a token.
def identity(
    x_user_id: Annotated[str, Header()],
    x_user_role: Annotated[str, Header()],
    authorization: Annotated[str, Header()],
) -> tuple[str, str, str]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    raw_jwt = authorization.removeprefix("Bearer ").strip()
    return x_user_id, x_user_role, raw_jwt


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(
    body: ChatRequest,
    ident: Annotated[tuple[str, str, str], Depends(identity)],
):
    """SSE endpoint. Streams: data: {"token": "..."}\\n\\n then data: [DONE]\\n\\n"""
    user_id, role, raw_jwt = ident
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
