FROM python:3.13-slim

RUN pip install --no-cache-dir uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /workspace

COPY pyproject.toml uv.lock ./

COPY packages/common ./packages/common

COPY services/catalog/pyproject.toml ./services/catalog/pyproject.toml

RUN uv sync --frozen --package catalog

COPY services/catalog/app ./services/catalog/app

WORKDIR /workspace/services/catalog

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

