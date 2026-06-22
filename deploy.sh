#!/usr/bin/env bash
# Bellissimo Couture - one-command production deploy (Git Bash / Linux)
#
# Run from the project root on the PROD server:
#   ./deploy.sh
#
# What it does, in order:
#   1. Pulls the latest code from GitHub (main)
#   2. Backend: installs deps, regenerates the Prisma client, applies DB migrations
#   3. Frontend: installs deps, rebuilds dist/ (served by IIS)
#   4. Restarts the API with pm2 so it loads the new code + Prisma client
set -euo pipefail

cd "$(dirname "$0")"
PM2_APP="bellissimo-api"

echo "=== Bellissimo Couture deploy ==="

echo ">>> git pull origin main"
git pull origin main

echo ">>> backend: npm install + prisma generate + migrate deploy"
cd server
npm install
npx prisma generate
npx prisma migrate deploy

echo ">>> frontend: npm install + build"
cd ../client
npm install
npm run build

echo ">>> restart API (pm2)"
cd ..
pm2 restart "$PM2_APP" --update-env
pm2 save

echo "=== Deploy complete ==="
echo "Tip: hard-refresh the site (Ctrl+F5) to bypass the browser cache."
