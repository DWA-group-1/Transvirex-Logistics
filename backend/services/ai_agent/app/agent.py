import json
import logging
import re
from collections.abc import AsyncGenerator

import httpx

from .config import settings
from .schemas import ChatMessage
from .tools import TOOLS

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

_TOOL_CALL_RE = re.compile(
    r"TOOL_CALL\s*:\s*(\w+)\s*\n\s*PARAMS\s*:\s*(\{.*?\})",
    re.DOTALL | re.IGNORECASE,
)

ROLE_CONTEXT = {
    "manager": (
        "You are a logistics manager assistant. "
        "You have full visibility over all deliveries, drivers, hubs, customers, and incidents."
    ),
    "dispatcher": (
        "You are a dispatcher assistant. "
        "You can view and manage deliveries, drivers, hubs, customers, and incidents."
    ),
    "driver": (
        "You are a driver assistant. "
        "You can only see your own assigned deliveries, their tracking history, and related incidents. "
        "You cannot access global delivery lists, driver lists, hub lists, or customer lists."
    ),
    "billing": (
        "You are a billing assistant. "
        "You have access to customer information and your notifications."
    ),
}


def _build_system_prompt(role: str, user_id: str) -> str:
    role_ctx = ROLE_CONTEXT.get(role, "You are a logistics assistant.")
    available_tools = {
        name: meta for name, meta in TOOLS.items() if role in meta["allowed_roles"]
    }
    tool_lines = "\n".join(
        f"- {name}: {meta['description']}" for name, meta in available_tools.items()
    )
    return f"""{role_ctx}

The current user has role="{role}" and user_id="{user_id}".

IMPORTANT: You MUST call a tool before giving ANY answer about deliveries, drivers, incidents, hubs, customers, or notifications. You are NOT allowed to answer from memory or make assumptions. If you don't have real data from a tool, you cannot answer.

To call a tool, reply with ONLY this, nothing else before or after:
TOOL_CALL: <tool_name>
PARAMS: {{"param1": "value1"}}

After receiving OBSERVATION: results, you may answer in plain English.

Rules:
- NEVER answer logistics questions without calling a tool first.
- NEVER invent, guess, or assume data.
- NEVER mention tool names, parameter names, UUIDs, or technical details to the user.
- If the user's role cannot access something, explain it simply and offer what you can do.
- Write like a helpful human colleague. No jargon, no code, no bullet lists unless helpful.

Available tools (never mention these by name to the user):
{tool_lines}
"""


async def _ollama_chat(messages: list[dict], stream: bool = False):
    payload = {"model": settings.ollama_model, "messages": messages, "stream": stream}
    logger.info("[ollama] sending %d messages, stream=%s", len(messages), stream)
    async with httpx.AsyncClient(timeout=60) as client:
        if stream:
            async with client.stream(
                "POST", f"{settings.ollama_url}/api/chat", json=payload
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.strip():
                        yield line
        else:
            resp = await client.post(f"{settings.ollama_url}/api/chat", json=payload)
            resp.raise_for_status()
            yield resp.text


async def run_agent(
    user_message: str,
    history: list[ChatMessage],
    role: str,
    user_id: str,
    jwt: str,
) -> AsyncGenerator[str, None]:
    logger.info(
        "[agent] START role=%s user_id=%s message=%r", role, user_id, user_message
    )

    system_prompt = _build_system_prompt(role, user_id)
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": user_message})

    for iteration in range(settings.max_tool_iterations):
        logger.info(
            "[agent] iteration %d/%d", iteration + 1, settings.max_tool_iterations
        )

        full_response = ""
        try:
            async for chunk in _ollama_chat(messages, stream=False):
                full_response = chunk
        except httpx.HTTPError as e:
            logger.error("[agent] ollama unreachable: %s", e)
            yield f"data: {json.dumps({'token': '[the assistant is unavailable right now]'})}\n\n"
            yield "data: [DONE]\n\n"
            return
        logger.info("[ollama] raw response: %r", full_response[:300])

        try:
            data = json.loads(full_response)
            assistant_text: str = data["message"]["content"]
        except Exception as e:
            logger.error(
                "[agent] Failed to parse Ollama response: %s — raw: %r",
                e,
                full_response[:300],
            )
            yield "data: [ERROR] Failed to parse Ollama response\n\n"
            yield "data: [DONE]\n\n"
            return

        logger.info("[agent] assistant_text: %r", assistant_text[:400])

        match = _TOOL_CALL_RE.search(assistant_text)
        logger.info("[agent] tool_match: %s", match.group(0) if match else None)

        if not match:
            logger.info("[agent] no tool call — streaming final answer")
            for char in assistant_text:
                yield f"data: {json.dumps({'token': char})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # ── Tool call ────────────────────────────────────────────────────────
        tool_name = match.group(1).strip()
        params_raw = match.group(2).strip()
        logger.info("[agent] tool_call: %s params_raw: %r", tool_name, params_raw)

        try:
            params = json.loads(params_raw)
        except json.JSONDecodeError:
            logger.warning("[agent] could not parse params JSON, using empty dict")
            params = {}

        messages.append({"role": "assistant", "content": assistant_text})

        tool_meta = TOOLS.get(tool_name)
        if tool_meta is None:
            observation = f"Error: unknown tool '{tool_name}'."
            logger.warning("[agent] unknown tool: %s", tool_name)
        elif role not in tool_meta["allowed_roles"]:
            observation = (
                f"Error: tool '{tool_name}' is not available for role '{role}'."
            )
            logger.warning("[agent] role %s not allowed for tool %s", role, tool_name)
        else:
            try:
                logger.info("[agent] calling tool %s with %s", tool_name, params)
                result = await tool_meta["fn"](jwt=jwt, **params)
                observation = json.dumps(result, default=str, ensure_ascii=False)
                logger.info("[agent] tool result: %r", observation[:400])
            except httpx.HTTPStatusError as exc:
                observation = (
                    f"API error {exc.response.status_code}: {exc.response.text}"
                )
                logger.error("[agent] tool HTTP error: %s", observation)
            except Exception as exc:
                observation = f"Tool error: {str(exc)}"
                logger.error("[agent] tool exception: %s", exc)

        messages.append({"role": "user", "content": f"OBSERVATION: {observation}"})

    # Max iterations reached
    logger.warning("[agent] max iterations reached, asking model to summarise")
    messages.append(
        {
            "role": "user",
            "content": (
                "You have reached the maximum number of tool calls. "
                "Please summarise what you found so far and answer the user's question."
            ),
        }
    )
    async for line in _ollama_chat(messages, stream=True):
        try:
            chunk_data = json.loads(line)
            token = chunk_data.get("message", {}).get("content", "")
            if token:
                yield f"data: {json.dumps({'token': token})}\n\n"
            if chunk_data.get("done"):
                break
        except Exception:
            continue
    yield "data: [DONE]\n\n"

