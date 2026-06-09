FROM python:3.13-slim

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY packages/common /common

COPY services/billing/pyproject.toml services/billing/uv.lock* ./
RUN uv sync --no-install-project

COPY services/billing/app ./app
COPY services/billing/migrations ./migrations
COPY services/billing/alembic.ini ./

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]