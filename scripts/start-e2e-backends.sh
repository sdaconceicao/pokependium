#!/usr/bin/env bash
# Start auth then pokedex-rest for Playwright. Sequential so both services'
# TypeORM migrations cannot race on the shared test database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JWT_SECRET="${JWT_SECRET:-test-secret-key-for-e2e-tests}"
export PRODUCT_NAME="${PRODUCT_NAME:-Poképendium}"
export FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://localhost:3010}"
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5434}"
export DB_USERNAME="${DB_USERNAME:-pokedex_user}"
export DB_PASSWORD="${DB_PASSWORD:-pokedex_password}"
export DB_DATABASE="${DB_DATABASE:-pokedex_test}"
export NODE_ENV=test

AUTH_PID=""
REST_PID=""

cleanup() {
  if [[ -n "${AUTH_PID}" ]]; then kill "${AUTH_PID}" 2>/dev/null || true; fi
  if [[ -n "${REST_PID}" ]]; then kill "${REST_PID}" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

PORT=3006 pnpm --filter auth start:test &
AUTH_PID=$!

auth_up=0
for _ in $(seq 1 90); do
  if curl -sf "http://localhost:3006/health" >/dev/null; then
    auth_up=1
    break
  fi
  if ! kill -0 "${AUTH_PID}" 2>/dev/null; then
    break
  fi
  sleep 1
done

if [[ "${auth_up}" -ne 1 ]]; then
  echo "auth failed to become healthy on :3006" >&2
  exit 1
fi

PORT=3005 pnpm --filter pokedex-rest start:test &
REST_PID=$!

wait "${AUTH_PID}" "${REST_PID}"
