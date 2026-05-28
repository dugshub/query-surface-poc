default:
    @just --list

# Common env — every recipe needs DATABASE_URL; PORT is for the web UI server.
# Override at the CLI: `DATABASE_URL=... just demo`
export DATABASE_URL := env_var_or_default("DATABASE_URL", "postgresql://qsp:qsp@localhost:5532/qsp")
export PORT := env_var_or_default("PORT", "3577")

# ─── App ──────────────────────────────────────────────────────────────

# Install deps
[group('app')]
install:
    bun install

# Serve the web UI (visual query surface) on $PORT → http://localhost:3577
[group('app')]
serve:
    bun src/server.ts

# Scripted describe/query/fetch example over the seam (prints and exits)
[group('app')]
demo:
    bun src/main.ts

# Typecheck — the gate; must pass before commits
[group('app')]
typecheck:
    bunx tsc --noEmit

# Typecheck + schema health check — run before committing
[group('app')]
verify: typecheck doctor

# Wipe db, push schema, seed — the "cold start" path (fresh DB, safe to push)
[group('app')]
reset: db-reset db-push seed

# ─── query-surface CLI ────────────────────────────────────────────────

# Run any CLI command, e.g. `just cli graph`, `just cli describe accounts --json`
[group('cli')]
cli *args:
    bun src/cli/index.ts {{args}}

# Schema health check — relationship gaps + relations() fixes
[group('cli')]
doctor:
    bun src/cli/index.ts doctor

# Render the data model as a tree
[group('cli')]
graph:
    bun src/cli/index.ts graph

# Schema overview at a glance
[group('cli')]
stats:
    bun src/cli/index.ts stats

# ─── MCP ──────────────────────────────────────────────────────────────

# Boot the stdio MCP server (usually spawned by Claude Code via .mcp.json)
[group('mcp')]
mcp:
    bun src/mcp.ts

# ─── Data ─────────────────────────────────────────────────────────────

# Seed the database from src/seed-data/deal-*.ts (10 deals; idempotent)
[group('data')]
seed:
    bun src/seed.ts

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

# Push Drizzle schema (dev). WARNING: on a seeded DB this truncates field_definitions — use `just seed` to restore.
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
