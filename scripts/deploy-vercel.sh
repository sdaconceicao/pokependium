#!/usr/bin/env bash
# Deploy all four Pokedex apps to Vercel Hobby (free tier).
# Prerequisites:
#   1. npx vercel login  (or set VERCEL_TOKEN)
#   2. Neon Free database with pooled connection — set REST env vars below
#   3. Run migrations once: ./scripts/run-neon-migrations.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! npx vercel whoami &>/dev/null; then
  echo "Not logged in to Vercel. Run: npx vercel login"
  exit 1
fi

# Required for REST API (set before running, or configure in Vercel dashboard)
: "${DB_HOST:?Set DB_HOST (Neon pooled host, e.g. ep-xxx-pooler.neon.tech)}"
: "${DB_USERNAME:?Set DB_USERNAME}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"
: "${DB_DATABASE:?Set DB_DATABASE}"
: "${JWT_SECRET:?Set JWT_SECRET}"
: "${FRONTEND_BASE_URL:?Set FRONTEND_BASE_URL}"
: "${PRODUCT_NAME:?Set PRODUCT_NAME (e.g. Poképendium)}"

DB_PORT="${DB_PORT:-5432}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://pokedex-frontend.vercel.app}"

echo "==> Deploying pokedex-auth..."
cd "$ROOT/backend/auth"
npx vercel link --yes --project pokedex-auth 2>/dev/null || npx vercel link --yes
npx vercel env add DB_HOST production <<< "$DB_HOST" 2>/dev/null || true
npx vercel env add DB_PORT production <<< "$DB_PORT" 2>/dev/null || true
npx vercel env add DB_USERNAME production <<< "$DB_USERNAME" 2>/dev/null || true
npx vercel env add DB_PASSWORD production <<< "$DB_PASSWORD" 2>/dev/null || true
npx vercel env add DB_DATABASE production <<< "$DB_DATABASE" 2>/dev/null || true
npx vercel env add JWT_SECRET production <<< "$JWT_SECRET" 2>/dev/null || true
npx vercel env add NODE_ENV production <<< "production" 2>/dev/null || true
npx vercel env add ALLOWED_ORIGINS production <<< "$ALLOWED_ORIGINS" 2>/dev/null || true
npx vercel env add ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC production <<< "3600" 2>/dev/null || true
npx vercel env add FRONTEND_BASE_URL production <<< "$FRONTEND_BASE_URL" 2>/dev/null || true
npx vercel env add PRODUCT_NAME production <<< "$PRODUCT_NAME" 2>/dev/null || true
AUTH_URL=$(npx vercel deploy --prod --yes)
echo "Auth deployed: $AUTH_URL"

echo "==> Deploying pokedex-rest..."
cd "$ROOT/backend/pokedex-rest"
npx vercel link --yes --project pokedex-rest 2>/dev/null || npx vercel link --yes
npx vercel env add DB_HOST production <<< "$DB_HOST" 2>/dev/null || true
npx vercel env add DB_PORT production <<< "$DB_PORT" 2>/dev/null || true
npx vercel env add DB_USERNAME production <<< "$DB_USERNAME" 2>/dev/null || true
npx vercel env add DB_PASSWORD production <<< "$DB_PASSWORD" 2>/dev/null || true
npx vercel env add DB_DATABASE production <<< "$DB_DATABASE" 2>/dev/null || true
npx vercel env add JWT_SECRET production <<< "$JWT_SECRET" 2>/dev/null || true
npx vercel env add NODE_ENV production <<< "production" 2>/dev/null || true
npx vercel env add ALLOWED_ORIGINS production <<< "$ALLOWED_ORIGINS" 2>/dev/null || true
REST_URL=$(npx vercel deploy --prod --yes)
echo "REST deployed: $REST_URL"

echo "==> Deploying pokedex-graphql..."
cd "$ROOT/backend/pokedex-graphql"
npx vercel link --yes --project pokedex-graphql 2>/dev/null || npx vercel link --yes
npx vercel env add ALLOWED_ORIGINS production <<< "$ALLOWED_ORIGINS" 2>/dev/null || true
GQL_URL=$(npx vercel deploy --prod --yes)
echo "GraphQL deployed: $GQL_URL"

echo "==> Deploying pokedex-frontend..."
cd "$ROOT/frontend"
npx vercel link --yes --project pokedex-frontend 2>/dev/null || npx vercel link --yes
npx vercel env add NEXT_PUBLIC_GRAPHQL_URL production <<< "${GQL_URL}/graphql" 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_AUTH_API_URL production <<< "$AUTH_URL" 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_REST_API_URL production <<< "$REST_URL" 2>/dev/null || true
# Preview envs point at production backends (free-tier)
npx vercel env add NEXT_PUBLIC_GRAPHQL_URL preview <<< "${GQL_URL}/graphql" 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_AUTH_API_URL preview <<< "$AUTH_URL" 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_REST_API_URL preview <<< "$REST_URL" 2>/dev/null || true
FE_URL=$(npx vercel deploy --prod --yes)
echo "Frontend deployed: $FE_URL"

echo ""
echo "Deployment complete!"
echo "  Frontend: $FE_URL"
echo "  GraphQL:  ${GQL_URL}/graphql"
echo "  Auth:     $AUTH_URL"
echo "  REST:     $REST_URL"
