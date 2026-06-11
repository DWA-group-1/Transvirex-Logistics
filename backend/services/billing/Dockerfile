FROM python:3.13-slim

RUN pip install --no-cache-dir uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /workspace

COPY pyproject.toml uv.lock ./

COPY packages/common ./packages/common

COPY services/billing/pyproject.toml ./services/billing/pyproject.toml

RUN uv sync --frozen --package billing

COPY services/billing/app ./services/billing/app

WORKDIR /workspace/services/billing

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
