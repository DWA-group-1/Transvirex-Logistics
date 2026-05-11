COMPOSE := $(shell \
  if command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then \
    echo "podman compose"; \
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
    echo "docker compose"; \
  else \
    echo ""; \
  fi)

.PHONY: help install install-frontend install-backend install-tools dev dev-frontend dev-backend db-up db-down db-logs clean check-tools

help:
	@echo "Transvirex Logistics — available commands:"
	@echo ""
	@echo "  make install         Install all dependencies (frontend + backend)"
	@echo "  make dev             Run frontend + backend + db together"
	@echo "  make dev-frontend    Run the React dev server"
	@echo "  make dev-backend     Run the FastAPI dev server"
	@echo "  make db-up           Start the Postgres container"
	@echo "  make db-down         Stop the Postgres container"
	@echo "  make db-logs         Follow the database logs"
	@echo "  make check-tools     Check that required tools are installed"
	@echo "  make clean           Remove build artifacts and caches"

check-tools:
	@command -v node >/dev/null 2>&1 || { echo "node not found. Install Node.js 20+: https://nodejs.org"; exit 1; }
	@command -v npm  >/dev/null 2>&1 || { echo "npm not found (should ship with node)"; exit 1; }
	@command -v uv   >/dev/null 2>&1 || { echo "uv not found. Installing..."; curl -LsSf https://astral.sh/uv/install.sh | sh; }
	@command -v podman >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || { echo "Neither podman nor docker found. Install one."; exit 1; }
	@if [ -z "$(COMPOSE)" ]; then \
	  echo "❌ No container runtime found. Install Docker Desktop (recommended) or Podman."; \
	  exit 1; \
	fi
	@echo "All required tools present (using $(COMPOSE))"

install: check-tools install-frontend install-backend
	@echo "All dependencies installed"

install-frontend: 
	@echo "Installing frontend dependencies"
	cd frontend && npm install

install-backend:
	@echo "Installing backend dependencies"
	cd backend && uv sync

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

dev: db-up
	@echo "Starting backend and frontend (Ctrl-C to stop :) )"
	@trap 'kill 0' INT; \
		$(MAKE) dev-backend & \
		$(MAKE) dev-frontend & \
		wait

db-up:
	$(COMPOSE) up -d db

db-down:
	$(COMPOSE) down

db-logs:
	$(COMPOSE) logs -f db

clean:
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/.venv backend/__pycache__ backend/.pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
