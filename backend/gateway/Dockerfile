FROM python:3.13-slim

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev

COPY src ./src

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]
