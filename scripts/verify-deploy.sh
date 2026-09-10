#!/usr/bin/env bash
# Smoke-test deployed Pokedex services.
# Usage: AUTH_URL=... REST_URL=... GQL_URL=... FE_URL=... ./scripts/verify-deploy.sh
set -euo pipefail

: "${AUTH_URL:?Set AUTH_URL}"
: "${REST_URL:?Set REST_URL}"
: "${GQL_URL:?Set GQL_URL}"
: "${FE_URL:?Set FE_URL}"

echo "Checking auth health..."
curl -sf "$AUTH_URL/health" | grep -q '"status":"ok"'

echo "Checking REST health..."
curl -sf "$REST_URL/health" | grep -q '"status":"ok"'

echo "Checking GraphQL..."
curl -sf -X POST "$GQL_URL/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ regions { id name } }"}' | grep -q '"data"'

echo "Checking frontend..."
curl -sf "$FE_URL" | grep -q -i "pok"

echo "All checks passed."
