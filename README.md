# Sarafi Digital Suite

Persian marketing site + customer/staff portal for صرافی سروری.

## Stack

- **Frontend:** React 19, TanStack Start/Router/Query, Tailwind CSS 4, Vite
- **Backend:** FastAPI, SQLAlchemy, Alembic, Argon2, JWT httpOnly cookies
- **Database:** PostgreSQL 15
- **Infra:** Docker Compose (same pattern as other Sarafi / SaaS projects)

## Ports

| Service  | Host port |
|----------|-----------|
| Frontend | 3004      |
| Backend  | 8003      |
| Postgres | 5437      |

## Quick start (all via Docker)

```sh
docker compose up --build
```

This starts Postgres, runs migrations + seed on backend startup, then serves the API and Vite frontend.

- App: http://localhost:3004
- API docs: http://localhost:8003/docs
- Health: http://localhost:8003/api/health

Seed admin: `admin@sarafi.local` / `Admin123!@#`

Stop with:

```sh
docker compose down
```

## Useful commands

```sh
# Tail logs
docker compose logs -f backend frontend

# Re-run seed / shell into backend
docker compose exec backend python -m app.services.seed
docker compose exec backend alembic upgrade head

# Postgres only (if you want to run backend/frontend on the host)
docker compose up -d postgres
```

## Local env

Copy `example.env` if you run tools outside Compose. Browser API URL stays `http://localhost:8003` even when frontend runs in Docker (cookies + CORS are set for host ports).

## Notes

- UI language is Persian (FA); design is unchanged from the original portal.
- Live FX rates poll the API every 15s (replaces Supabase realtime).
- Google OAuth (Lovable) was removed; email/password auth is supported.
