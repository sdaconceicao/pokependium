#!/usr/bin/env bash
# Run auth then REST migrations against Neon (one-time, before first Vercel deploy).
# Usage: export DB_HOST=... DB_USERNAME=... DB_PASSWORD=... DB_DATABASE=... && ./scripts/run-neon-migrations.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

: "${DB_HOST:?Set DB_HOST (Neon pooled host)}"
: "${DB_USERNAME:?Set DB_USERNAME}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"
: "${DB_DATABASE:?Set DB_DATABASE}"

export DB_PORT="${DB_PORT:-5432}"
export NODE_ENV=development

cd "$ROOT/backend/auth"
pn  migration:run

cd "$ROOT/backend/pokedex-rest"
pn  migration:run
