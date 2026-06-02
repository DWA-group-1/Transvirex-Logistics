# Transvirex Logistics

A microservices ERP for a fictional regional parcel carrier, built as a school
project (CESI). The system covers identity and access, master data (drivers and
hubs), real-time notifications, and is designed to grow toward delivery
dispatch, billing, and analytics.

The backend is a set of independent FastAPI services behind an API gateway, each
with its own PostgreSQL database, integrated through a Redis Streams event bus.
The frontend is a React single-page application.

## Stack

- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0 (async), Alembic, psycopg3
- **Databases:** PostgreSQL 17 (one per service)
- **Event bus:** Redis Streams
- **Auth:** RS256 JWT (asymmetric — Auth signs, others verify), opaque refresh tokens
- **Package manager:** uv (Python), npm (frontend)
- **Frontend:** React, TypeScript, Vite, React-Bootstrap
- **Orchestration:** Docker / Podman Compose

## Prerequisites

- Docker with the compose plugin
- `uv` for Python dependency management (only needed for host-side tooling)
- Node + npm (only needed to run the frontend outside a container)
- `openssl` to generate the JWT signing keys

## Setup

### 1. Environment file

```bash
cp .env.example .env
```

Edit `.env` and set the database credentials and any other values. The committed
`.env.example` lists every variable the compose stack expects.

### 2. Generate JWT signing keys

Auth signs access tokens with an RS256 **private** key; the gateway and other
services verify them with the matching **public** key. These keys are not
committed to the repository. Generate them once:

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

The `keys/` directory is mounted read-only into the containers at
`/run/secrets/keys/`. **Do not commit these files** — `keys/` is gitignored.

### 3. Build and start

```bash
make setup     # build images, run migrations, seed the admin user
make up        # start the full stack
```

The gateway is then reachable at `http://localhost:8000`. Backend services are
not exposed on the host directly — all traffic goes through the gateway.

### 4. Verify

```bash
# Get an admin token (form-encoded login)
curl -s -X POST http://localhost:8000/auth/token \
  -d "username=admin@transvirex.local&password=<seed-password>" | jq

# Use the access_token to hit a protected endpoint
curl http://localhost:8000/catalog/drivers \
  -H "Authorization: Bearer <access_token>"
```

## Common commands

These are the make targets used day to day. `s=<service>` selects a service
(`auth`, `notification`, `catalog`).

```bash
make up                       # start the stack
make down                     # stop the stack
make logs s=catalog           # follow a service's logs
make shell s=catalog          # shell into a running service
make psql-catalog             # psql into a service's database

make migrate                  # apply all pending migrations (all services)
make migrate-catalog          # apply migrations for one service
make migrate-create s=catalog m="message"   # autogenerate a migration

make seed-admin               # create the initial admin user
make sync                     # rebuild + restart + migrate after a pull
make nuke                     # ⚠ destroy all containers AND volumes (data loss)
```

`make nuke` removes database volumes — only use it when you want a clean slate.

## Project layout

```
backend/
  gateway/                 API gateway (routing, JWT verification)
  services/
    auth/                  identity, JWT, refresh tokens
    catalog/               drivers and hubs
    notification/          event subscriber, WebSocket fan-out
frontend/                  React + TypeScript + Vite SPA
keys/                      RS256 key pair (gitignored, generated locally)
docs/
  EVENTS.md                event bus contract
compose.yml                full-stack orchestration
.env.example               required environment variables
```

Each backend service follows the same internal structure: `app/main.py`
(application + lifespan), `app/config.py` (settings), `app/database.py`,
`app/models.py`, `app/schemas.py`, `app/events.py` (event bus client), and an
`app/routes/` package.

## Authentication model

- Login (`POST /auth/token`) returns an **access token** (RS256 JWT, short-lived)
  and an opaque **refresh token** (long-lived, stored in `auth_db`).
- The gateway verifies the access token on every request except the public
  endpoints (`auth/token`, `auth/token/refresh`, `auth/token/revoke`), then
  forwards the caller's identity to downstream services as `X-User-Id` and
  `X-User-Role` headers. Downstream services trust these headers and do not
  re-verify the token.
- Roles: `driver`, `dispatcher`, `billing`, `manager`. `is_admin` is a separate
  flag, orthogonal to the business role, granting cross-cutting operations such
  as account management.
- New accounts are created only by an authenticated admin (`POST /auth/register`);
  public registration is disabled.

## Events

Services communicate state changes asynchronously over Redis Streams. The event
contract — stream names, event types, and payloads — is documented in
[`docs/EVENTS.md`](docs/EVENTS.md).
