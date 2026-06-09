FROM python:3.13-slim

RUN pip install --no-cache-dir uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /workspace

COPY pyproject.toml uv.lock ./

COPY packages/common ./packages/common

COPY services/delivery/pyproject.toml ./services/delivery/pyproject.toml

RUN uv sync --frozen --package delivery

COPY services/delivery/app ./services/delivery/app

WORKDIR /workspace/services/delivery

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
