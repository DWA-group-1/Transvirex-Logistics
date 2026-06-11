FROM python:3.13-slim

RUN pip install --no-cache-dir uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /workspace

COPY pyproject.toml uv.lock ./

COPY packages/common ./packages/common

COPY services/ai_agent/pyproject.toml ./services/ai_agent/pyproject.toml

COPY services/ai_agent/app ./services/ai_agent/app

RUN uv sync --frozen --package ai_agent

COPY services/ai_agent/app ./services/ai_agent/app

WORKDIR /workspace/services/ai_agent

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

