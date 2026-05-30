# Flag Check Backend

Express + TypeScript + Prisma backend for the multi-tenant feature flag assignment.

## Setup

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

API base URL:

```text
http://localhost:3000/api
```

Super Admin credentials are config-only through `.env`; they are not stored in the database.

The Docker Compose file maps Postgres to host port `5433` to avoid conflicts with any existing local Postgres service. Inside Docker, Postgres still runs on port `5432`.
