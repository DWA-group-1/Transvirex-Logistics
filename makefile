COMPOSE := $(shell \
  if command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then \
    echo "podman compose"; \
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
    echo "docker compose"; \
  else \
    echo ""; \
  fi)

AUTH_DIR     := backend/services/auth
NOTIF_DIR    := backend/services/notification
CATALOG_DIR  := backend/services/catalog
DELIVERY_DIR := backend/services/delivery
GATEWAY_DIR  := backend/gateway
FRONTEND_DIR := frontend

# Default service for generic targets (override with s=<name>)
s ?= auth

.PHONY: help check-tools \
        setup sync \
        install-host install-auth install-notif install-catalog install-delivery install-gateway install-frontend \
        up down restart build rebuild \
        ps logs \
        logs-auth logs-notif logs-catalog logs-delivery logs-gateway logs-frontend \
        logs-auth-db logs-notif-db logs-catalog-db logs-delivery-db \
        shell shell-auth shell-notif shell-catalog shell-delivery shell-gateway shell-frontend \
        psql-auth psql-notif psql-catalog psql-delivery \
        migrate migrate-auth migrate-notif migrate-catalog migrate-delivery \
        migrate-create migrate-create-auth migrate-create-notif migrate-create-catalog migrate-create-delivery \
        migrate-current migrate-current-auth migrate-current-notif migrate-current-catalog migrate-current-delivery \
        migrate-history migrate-history-auth migrate-history-notif migrate-history-catalog migrate-history-delivery \
        seed-admin \
        test test-auth test-notif test-catalog test-delivery lint format \
        clean nuke

.DEFAULT_GOAL := help

help:
	@echo "Transvirex Logistics — available commands"
	@echo ""
	@echo "Setup (run once on a new machine)"
	@echo "  make check-tools       Verify required tools are installed"
	@echo "  make setup             Full first-time setup (host deps + build + migrate + seed)"
	@echo ""
	@echo "Daily workflow"
	@echo "  make up                Start all containers"
	@echo "  make down              Stop all containers"
	@echo "  make sync              After git pull: install host deps + rebuild containers"
	@echo "  make restart s=auth    Restart one service (s=auth|notification|catalog|delivery|gateway|frontend)"
	@echo ""
	@echo "Build"
	@echo "  make build             Build images without starting"
	@echo "  make rebuild           Force rebuild from scratch (no cache)"
	@echo ""
	@echo "Inspect"
	@echo "  make ps                List running containers"
	@echo "  make logs s=auth       Tail logs of one service"
	@echo "  make logs-auth         Tail auth service logs"
	@echo "  make logs-notif        Tail notification service logs"
	@echo "  make logs-catalog      Tail catalog service logs"
	@echo "  make logs-delivery     Tail delivery service logs"
	@echo "  make logs-gateway      Tail gateway logs"
	@echo "  make logs-frontend     Tail frontend logs"
	@echo "  make logs-auth-db      Tail auth_db logs"
	@echo "  make logs-notif-db     Tail notification_db logs"
	@echo "  make logs-catalog-db   Tail catalog_db logs"
	@echo "  make logs-delivery-db  Tail delivery_db logs"
	@echo "  make shell s=auth      Shell into a service container"
	@echo "  make shell-auth        Shell into auth container"
	@echo "  make shell-notif       Shell into notification container"
	@echo "  make shell-catalog     Shell into catalog container"
	@echo "  make shell-delivery    Shell into delivery container"
	@echo "  make shell-gateway     Shell into gateway container"
	@echo "  make shell-frontend    Shell into frontend container"
	@echo "  make psql-auth         psql into auth_db"
	@echo "  make psql-notif        psql into notification_db"
	@echo "  make psql-catalog      psql into catalog_db"
	@echo "  make psql-delivery     psql into delivery_db"
	@echo ""
	@echo "Database migrations"
	@echo "  make migrate                            Apply pending migrations to all services"
	@echo "  make migrate-auth                       Apply pending migrations to auth"
	@echo "  make migrate-notif                      Apply pending migrations to notification"
	@echo "  make migrate-catalog                    Apply pending migrations to catalog"
	@echo "  make migrate-delivery                   Apply pending migrations to delivery"
	@echo "  make migrate-create s=auth m='message'  Generate new migration for service s"
	@echo "  make migrate-current                    Show current revision for all services"
	@echo "  make migrate-history                    Show migration history for all services"
	@echo ""
	@echo "Seed"
	@echo "  make seed-admin        Create the initial admin user (email: admin@transvirex.local)"
	@echo ""
	@echo "Test & lint"
	@echo "  make test              Run all tests"
	@echo "  make test-auth         Run auth service tests"
	@echo "  make test-notif        Run notification service tests"
	@echo "  make test-catalog      Run catalog service tests"
	@echo "  make test-delivery     Run delivery service tests"
	@echo "  make lint              Run ruff on all services"
	@echo "  make format            Format all services with ruff"
	@echo ""
	@echo "Housekeeping"
	@echo "  make clean             Remove caches and build artifacts"
	@echo "  make nuke              Stop containers and wipe volumes (loses DB data!)"

check-tools:
	@command -v node >/dev/null 2>&1 || { echo "node not found. Install Node.js 20+: https://nodejs.org"; exit 1; }
	@command -v npm  >/dev/null 2>&1 || { echo "npm not found (should ship with node)"; exit 1; }
	@command -v uv   >/dev/null 2>&1 || { echo "uv not found. Install: https://docs.astral.sh/uv/"; exit 1; }
	@[ -n "$(COMPOSE)" ] || { echo "Neither 'podman compose' nor 'docker compose' found"; exit 1; }
	@echo "All tools OK. Using: $(COMPOSE)"

setup: check-tools install-host build up migrate seed-admin
	@echo ""
	@echo "Setup complete. Gateway on http://localhost:8000, frontend on http://localhost:5173"

sync: install-host rebuild up migrate
	@echo "Sync complete."

install-host: install-auth install-notif install-catalog install-delivery install-gateway install-frontend

install-auth:
	cd $(AUTH_DIR) && uv sync

install-notif:
	cd $(NOTIF_DIR) && uv sync

install-catalog:
	cd $(CATALOG_DIR) && uv sync

install-delivery:
	cd $(DELIVERY_DIR) && uv sync

install-gateway:
	cd $(GATEWAY_DIR) && uv sync

install-frontend:
	cd $(FRONTEND_DIR) && npm install

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart $(s)

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) build --no-cache

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f $(s)

logs-auth:
	$(COMPOSE) logs -f auth

logs-notif:
	$(COMPOSE) logs -f notification

logs-catalog:
	$(COMPOSE) logs -f catalog

logs-delivery:
	$(COMPOSE) logs -f delivery

logs-gateway:
	$(COMPOSE) logs -f gateway

logs-frontend:
	$(COMPOSE) logs -f frontend

logs-auth-db:
	$(COMPOSE) logs -f auth_db

logs-notif-db:
	$(COMPOSE) logs -f notification_db

logs-catalog-db:
	$(COMPOSE) logs -f catalog_db

logs-delivery-db:
	$(COMPOSE) logs -f delivery_db

shell:
	$(COMPOSE) exec $(s) sh

shell-auth:
	$(COMPOSE) exec auth sh

shell-notif:
	$(COMPOSE) exec notification sh

shell-catalog:
	$(COMPOSE) exec catalog sh

shell-delivery:
	$(COMPOSE) exec delivery sh

shell-gateway:
	$(COMPOSE) exec gateway sh

shell-frontend:
	$(COMPOSE) exec frontend sh

# psql targets read env vars *inside* the container, not on the host.
# $$ escapes Make's variable expansion so the dollar reaches the shell.
psql-auth:
	$(COMPOSE) exec auth_db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

psql-notif:
	$(COMPOSE) exec notification_db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

psql-catalog:
	$(COMPOSE) exec catalog_db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

psql-delivery:
	$(COMPOSE) exec delivery_db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

migrate: migrate-auth migrate-notif migrate-catalog migrate-delivery

migrate-auth:
	$(COMPOSE) exec auth alembic upgrade head

migrate-notif:
	$(COMPOSE) exec notification alembic upgrade head

migrate-catalog:
	$(COMPOSE) exec catalog alembic upgrade head

migrate-delivery:
	$(COMPOSE) exec delivery alembic upgrade head

# Generate a new migration. Usage: make migrate-create s=auth m="message"
migrate-create:
	@[ -n "$(m)" ] || { echo "Usage: make migrate-create s=<service> m=\"message\""; exit 1; }
	$(COMPOSE) exec $(s) alembic revision --autogenerate -m "$(m)"

migrate-create-auth:
	@[ -n "$(m)" ] || { echo "Usage: make migrate-create-auth m=\"message\""; exit 1; }
	$(COMPOSE) exec auth alembic revision --autogenerate -m "$(m)"

migrate-create-notif:
	@[ -n "$(m)" ] || { echo "Usage: make migrate-create-notif m=\"message\""; exit 1; }
	$(COMPOSE) exec notification alembic revision --autogenerate -m "$(m)"

migrate-create-catalog:
	@[ -n "$(m)" ] || { echo "Usage: make migrate-create-catalog m=\"message\""; exit 1; }
	$(COMPOSE) exec catalog alembic revision --autogenerate -m "$(m)"

migrate-create-delivery:
	@[ -n "$(m)" ] || { echo "Usage: make migrate-create-delivery m=\"message\""; exit 1; }
	$(COMPOSE) exec delivery alembic revision --autogenerate -m "$(m)"

migrate-current: migrate-current-auth migrate-current-notif migrate-current-catalog migrate-current-delivery

migrate-current-auth:
	@echo "── auth ──"
	$(COMPOSE) exec auth alembic current

migrate-current-notif:
	@echo "── notification ──"
	$(COMPOSE) exec notification alembic current

migrate-current-catalog:
	@echo "── catalog ──"
	$(COMPOSE) exec catalog alembic current

migrate-current-delivery:
	@echo "── delivery ──"
	$(COMPOSE) exec delivery alembic current

migrate-history: migrate-history-auth migrate-history-notif migrate-history-catalog migrate-history-delivery

migrate-history-auth:
	@echo "── auth ──"
	$(COMPOSE) exec auth alembic history

migrate-history-notif:
	@echo "── notification ──"
	$(COMPOSE) exec notification alembic history

migrate-history-catalog:
	@echo "── catalog ──"
	$(COMPOSE) exec catalog alembic history

migrate-history-delivery:
	@echo "── delivery ──"
	$(COMPOSE) exec delivery alembic history

seed-admin:
	$(COMPOSE) exec auth python -m scripts.seed_admin

test: test-auth test-notif test-catalog test-delivery

test-auth:
	$(COMPOSE) exec auth pytest

test-notif:
	$(COMPOSE) exec notification pytest

test-catalog:
	$(COMPOSE) exec catalog pytest

test-delivery:
	$(COMPOSE) exec delivery pytest

lint:
	cd $(AUTH_DIR)     && uv run ruff check .
	cd $(NOTIF_DIR)    && uv run ruff check .
	cd $(CATALOG_DIR)  && uv run ruff check .
	cd $(DELIVERY_DIR) && uv run ruff check .
	cd $(GATEWAY_DIR)  && uv run ruff check .

format:
	cd $(AUTH_DIR)     && uv run ruff format .
	cd $(NOTIF_DIR)    && uv run ruff format .
	cd $(CATALOG_DIR)  && uv run ruff format .
	cd $(DELIVERY_DIR) && uv run ruff format .
	cd $(GATEWAY_DIR)  && uv run ruff format .

clean:
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	find . -type d -name .pytest_cache -prune -exec rm -rf {} +
	find . -type d -name .ruff_cache -prune -exec rm -rf {} +
	cd $(FRONTEND_DIR) && rm -rf dist node_modules/.vite

nuke:
	$(COMPOSE) down -v
