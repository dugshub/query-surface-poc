default:
    @just --list

# Common env — every recipe needs DATABASE_URL; PORT is for the NestJS server.
# Override at the CLI: `DATABASE_URL=... just demo`
export DATABASE_URL := env_var_or_default("DATABASE_URL", "postgresql://qsp:qsp@localhost:5532/qsp")
export PORT := env_var_or_default("PORT", "3577")

# ─── App ──────────────────────────────────────────────────────────────

# Install deps
[group('app')]
install:
    bun install

# Boot the NestJS HTTP server (POST /search + /fetch on $PORT)
[group('app')]
serve:
    bun src/main.ts

# Boot server + Drizzle Studio together (studio killed when server stops)
[group('app')]
start:
    #!/usr/bin/env bash
    bunx drizzle-kit studio --config=drizzle.config.ts &
    STUDIO_PID=$!
    trap "kill $STUDIO_PID 2>/dev/null" EXIT
    bun src/main.ts

# Typecheck — must pass before commits
[group('app')]
typecheck:
    bunx tsc --noEmit

# Run codegen across all entity YAMLs (regenerates modules + barrels)
[group('app')]
gen:
    yes | bun /Users/dug/Projects/dealbrain-integrations/codegen-patterns/dist/src/cli/index.js entity new --all

# ─── Demos ────────────────────────────────────────────────────────────

# Seed the database from src/seed-data/deal-*.ts (10 deals)
[group('demo')]
seed:
    bun src/seed.ts

# Direct-DB CLI demo (6 escalating queries, prints SQL + results)
[group('demo')]
demo:
    bun src/demo.ts

# HTTP demo (5 scenes via POST /search + /fetch) — requires `just serve` running
[group('demo')]
demo-api:
    bun src/demo-api.ts

# Boot the stdio MCP server (usually spawned by Claude Code, not hand-run)
[group('demo')]
mcp-server:
    bun src/mcp-server.ts

# End-to-end MCP test (spawns server via stdio, exercises both tools — 5 assertions)
[group('demo')]
mcp-test:
    bun src/mcp-test.ts

# Full verification: typecheck + seed + CLI demo + MCP test.
# Use this before declaring "the demo works."
[group('demo')]
verify: typecheck seed demo mcp-test

# ─── Database ─────────────────────────────────────────────────────────

# Start postgres (waits for healthy)
[group('db')]
db-up:
    docker compose up -d postgres
    @until docker compose exec postgres \
        pg_isready -U qsp -d qsp -q; \
        do sleep 0.5; done
    @echo "postgres is ready (localhost:5532)"

# Stop postgres (keeps qsp-pgdata volume)
[group('db')]
db-down:
    docker compose down

# Wipe + restart postgres (drops qsp-pgdata volume)
[group('db')]
db-reset:
    docker compose down -v && just db-up

# Push Drizzle schema (dev, no migrations)
[group('db')]
db-push:
    bunx drizzle-kit push --config=drizzle.config.ts

# Generate a Drizzle migration
[group('db')]
db-generate name:
    bunx drizzle-kit generate --config=drizzle.config.ts --name={{name}}

# Open Drizzle Studio
[group('db')]
db-studio:
    bunx drizzle-kit studio --config=drizzle.config.ts

# psql into the running container
[group('db')]
db-psql:
    docker compose exec postgres psql -U qsp -d qsp

# ─── Full reset ───────────────────────────────────────────────────────

# Wipe db, push schema, seed — the "cold start" path
[group('app')]
reset: db-reset db-push seed
