FROM python:3.13-slim

RUN pip install --no-cache-dir uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /workspace

COPY pyproject.toml uv.lock ./

COPY packages/common ./packages/common

COPY services/notification/pyproject.toml ./services/notification/pyproject.toml

COPY services/notification/app ./services/notification/app

RUN uv sync --frozen --package notification

COPY services/notification/app ./services/notification/app

WORKDIR /workspace/services/notification

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
