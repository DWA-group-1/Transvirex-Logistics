FROM python:3.13-slim

RUN pip install --no-cache-dir uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /workspace

COPY pyproject.toml uv.lock ./

COPY packages/common ./packages/common

COPY services/delivery/pyproject.toml ./services/delivery/pyproject.toml

RUN uv sync --frozen --package auth

COPY services/delivery/app ./delivery/delivery/app

WORKDIR /workspace/delivery/delivery

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


