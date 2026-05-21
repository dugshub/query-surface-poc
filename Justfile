default:
    @just --list

# ─── App ──────────────────────────────────────────────────────────────

# Install deps
[group('app')]
install:
    bun install

# Run the NestJS app (src/main.ts)
[group('app')]
start:
    bun src/main.ts

# Seed the database
[group('app')]
seed:
    bun src/seed.ts

# Run the demo script
[group('app')]
demo:
    bun src/demo.ts

# Run codegen (codegen-patterns CLI)
[group('app')]
gen:
    bun run codegen

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

# Wipe db, push schema, seed
[group('app')]
reset: db-reset db-push seed
