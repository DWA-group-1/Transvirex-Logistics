COMPOSE := $(shell \
  if command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then \
    echo "podman compose"; \
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
    echo "docker compose"; \
  else \
    echo ""; \
  fi)

AUTH_DIR := backend/services/auth

.PHONY: help check-tools install install-frontend install-auth \
        up up-build down logs ps \
        dev dev-frontend dev-auth-host \
        auth-shell auth-psql migrate migrate-create \
        test clean

help:
	@echo "Transvirex Logistics — available commands:"
	@echo ""
	@echo "  Setup"
	@echo "    make check-tools     Verify required tools are installed"
	@echo "    make install         Install all host-side dependencies"
	@echo ""
	@echo "  Run (containers)"
	@echo "    make up              Start all services in the background"
	@echo "    make up-build        Rebuild images, then start"
	@echo "    make down            Stop and remove all containers"
	@echo "    make logs            Tail logs from all services"
	@echo "    make ps              List running containers"
	@echo ""
	@echo "  Dev workflows"
	@echo "    make dev             Containers up + frontend dev server"
	@echo "    make dev-frontend    Frontend dev server only (host)"
	@echo "    make dev-auth-host   Run auth on host with --reload (DB stays in container)"
	@echo ""
	@echo "  Database / migrations"
	@echo "    make auth-shell      Shell into the auth container"
	@echo "    make auth-psql       psql into the auth_db database"
	@echo "    make migrate         Apply pending migrations to auth_db"
	@echo "    make migrate-create m='message'  Generate a new migration"
	@echo ""
	@echo "  Tests / housekeeping"
	@echo "    make test            Run auth service tests"
	@echo "    make clean           Remove build artifacts, caches, venvs"

check-tools:
	@command -v node >/dev/null 2>&1 || { echo "node not found. Install Node.js 20+: https://nodejs.org"; exit 1; }
	@command -v npm  >/dev/null 2>&1 || { echo "npm not found (should ship with node)"; exit 1; }
	@command -v uv   >/dev/null 2>&1 || { echo "uv not found. Run: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "No container runtime found. Install podman or docker."; \
	  exit 1; \
	fi
	@echo "All required tools present (using $(COMPOSE))"

install: check-tools install-frontend install-auth
	@echo "All dependencies installed"

install-frontend:
	@echo "Installing frontend dependencies"
	cd frontend && npm install

install-auth:
	@echo "Installing auth service dependencies"
	cd $(AUTH_DIR) && uv sync

up:
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down --remove-orphans

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

dev: up
	@echo "Containers running. Starting frontend dev server (Ctrl-C to stop)"
	$(MAKE) dev-frontend

dev-frontend:
	cd frontend && npm run dev

# Host-mode auth: useful for fast iteration with --reload.
# DB must already be up (via `make up` or `$(COMPOSE) up -d auth_db`).
# Overrides DATABASE_URL to point at the DB's host-exposed port.
# Note: requires auth_db to expose port 5432 to host — re-add that if you want this.
dev-auth-host:
	cd $(AUTH_DIR) && \
	  DATABASE_URL="postgresql+psycopg://$$AUTH_DB_USER:$$AUTH_DB_PASSWORD@localhost:5432/authentication" \
	  uv run uvicorn app.main:app --reload --port 8001

auth-shell:
	$(COMPOSE) exec auth bash

auth-psql:
	$(COMPOSE) exec auth_db psql -U $$AUTH_DB_USER -d authentication

migrate:
	$(COMPOSE) exec auth uv run alembic upgrade head

migrate-create:
	@if [ -z "$(m)" ]; then echo "Usage: make migrate-create m='your message'"; exit 1; fi
	$(COMPOSE) exec auth uv run alembic revision --autogenerate -m "$(m)"

test:
	cd $(AUTH_DIR) && uv run pytest

clean:
	rm -rf frontend/node_modules frontend/dist
	rm -rf $(AUTH_DIR)/.venv
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
