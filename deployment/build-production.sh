#!/usr/bin/env bash
# Builds the production release package for Hostinger.
#
# Output: backend/ is production-ready (compiled SPA inside public/build,
# composer dependencies without dev packages). Upload backend/ per
# docs/deployment-hostinger.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building frontend (React + Vite)"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> Installing backend production dependencies"
cd "$ROOT/backend"
composer install --no-dev --optimize-autoloader

echo "==> Clearing caches (regenerated on the server)"
php artisan optimize:clear -q || true

echo
echo "Done. Deploy checklist:"
echo "  1. upload backend/ (exclude .env, storage/logs, node_modules)"
echo "  2. server: php artisan migrate --force && php artisan storage:link"
echo "  3. server: php artisan config:cache route:cache view:cache"
echo "  4. verify https://community.fireshark.in (docs/deployment-hostinger.md §12)"
