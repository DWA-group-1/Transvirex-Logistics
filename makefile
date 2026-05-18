COMPOSE := $(shell \
  if command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then \
    echo "podman compose"; \
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
    echo "docker compose"; \
  else \
    echo ""; \
  fi)

AUTH_DIR := backend/services/auth
FRONTEND_DIR := frontend

.PHONY: help check-tools \
        setup sync install-host install-auth install-frontend \
        up down restart build rebuild \
        ps logs logs-auth logs-frontend logs-auth-db \
        shell-auth shell-frontend psql-auth \
        migrate migrate-create migrate-history migrate-current \
        test test-auth lint format \
        clean nuke

.DEFAULT_GOAL := help

help:
	@echo "Transvirex Logistics — available commands"
	@echo ""
	@echo "Setup (run once on a new machine)"
	@echo "  make check-tools     Verify required tools are installed"
	@echo "  make setup           Full first-time setup (host deps + build + migrate)"
	@echo ""
	@echo "Daily workflow"
	@echo "  make up              Start all containers"
	@echo "  make down            Stop all containers"
	@echo "  make sync            After git pull: install host deps + rebuild containers"
	@echo "  make restart s=auth  Restart one service"
	@echo ""
	@echo "Build"
	@echo "  make build           Build images without starting"
	@echo "  make rebuild         Force rebuild from scratch (no cache)"
	@echo ""
	@echo "Inspect"
	@echo "  make ps              List running containers"
	@echo "  make logs            Tail all logs"
	@echo "  make logs-auth       Tail auth service logs"
	@echo "  make logs-frontend   Tail frontend logs"
	@echo "  make logs-db         Tail auth_db logs"
	@echo "  make shell-auth      Shell into auth container"
	@echo "  make shell-frontend  Shell into frontend container"
	@echo "  make psql            psql into auth_db"
	@echo ""
	@echo "Database migrations"
	@echo "  make migrate                       Apply pending migrations"
	@echo "  make migrate-create m='message'    Generate new migration"
	@echo "  make migrate-current               Show current migration version"
	@echo "  make migrate-history               Show migration history"
	@echo ""
	@echo "Test & lint"
	@echo "  make test            Run all tests"
	@echo "  make test-auth       Run auth service tests"
	@echo "  make lint            Run ruff on auth service"
	@echo "  make format          Format auth service with ruff"
	@echo ""
	@echo "Housekeeping"
	@echo "  make clean           Remove caches and build artifacts"
	@echo "  make nuke            Stop containers and wipe volumes (loses DB data!)"

check-tools:
	@command -v node >/dev/null 2>&1 || { echo "node not found. Install Node.js 20+: https://nodejs.org"; exit 1; }
	@command -v npm  >/dev/null 2>&1 || { echo "npm not found (should ship with node)"; exit 1; }
	@command -v uv   >/dev/null 2>&1 || { echo "uv not found. Run: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "No container runtime found. Install podman or docker."; \
	  exit 1; \
	fi
	@echo "All required tools present (using $(COMPOSE))"

setup: check-tools install-host build up migrate
	@echo ""
	@echo "Setup complete. Run 'make logs' to see what's running."

sync: install-host build
	@echo ""
	@echo "Sync complete. Run 'make up' to start, or 'make restart s=<service>'."

install-host: install-auth install-frontend
	@echo "Host-side dependencies installed (for IDE/editor support)."

install-auth:
	@echo "Installing auth service deps on host..."
	cd $(AUTH_DIR) && uv sync

install-frontend:
	@echo "Installing frontend deps on host..."
	cd $(FRONTEND_DIR) && npm install

dev: up
	@echo ""
	@echo "Backend up. Starting frontend on host..."
	@echo "Gateway: http://localhost:8080"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	cd frontend && npm run dev

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down --remove-orphans

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) build --no-cache

# Restart a specific service. Usage: make restart s=auth
restart:
	@if [ -z "$(s)" ]; then echo "Usage: make restart s=<service>"; exit 1; fi
	$(COMPOSE) restart $(s)

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-auth:
	$(COMPOSE) logs -f auth

logs-frontend:
	$(COMPOSE) logs -f frontend

logs-auth-db:
	$(COMPOSE) logs -f auth_db

shell-auth:
	$(COMPOSE) exec auth bash

shell-frontend:
	$(COMPOSE) exec frontend sh

psql-auth:
	$(COMPOSE) exec auth_db psql -U $$AUTH_DB_USER -d authentication

migrate:
	@if [ -n "$(m)" ]; then echo "Note: 'm=...' is ignored by 'migrate'. Did you mean 'migrate-create'?"; fi
	$(COMPOSE) exec auth alembic upgrade head

migrate-create:
	@if [ -z "$(m)" ]; then echo "Usage: make migrate-create m='your message'"; exit 1; fi
	$(COMPOSE) exec auth alembic revision --autogenerate -m "$(m)"

migrate-current:
	$(COMPOSE) exec auth alembic current

migrate-history:
	$(COMPOSE) exec auth alembic history

test: test-auth

test-auth:
	$(COMPOSE) exec auth pytest

lint:
	cd $(AUTH_DIR) && uv run ruff check .

format:
	cd $(AUTH_DIR) && uv run ruff format .

clean:
	rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/dist
	rm -rf $(AUTH_DIR)/.venv
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .ruff_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +

nuke:
	@echo "This will DELETE all containers and database data. Press Ctrl-C to cancel, Enter to continue."
	@read _
	$(COMPOSE) down --remove-orphans -v
	@echo "Wiped. Run 'make setup' to start fresh."

.PHONY: up-demo
up-demo:
	$(COMPOSE) --profile demo up -d --build

.PHONY: down-demo
down-demo:
	$(COMPOSE) --profile demo down
