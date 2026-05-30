#!/bin/bash

# start.sh
# Technical Monospace Brutalist Launcher for the Flag-Check multi-tenant suite

# Exit on any failure during setup
set -e

echo "=========================================================="
echo "📰 BYEPO TECHNOLOGIES — MULTI-TENANT CONSOLE LAUNCHER"
echo "=========================================================="

# 1. Start PostgreSQL Container in backend
echo "🐳 1. Initiating PostgreSQL container in the background..."
docker compose -f backend/docker-compose.yml up -d

# 2. Bounded wait for Database to accept connections
echo "⏳ 2. Allowing database to settle..."
sleep 2

# 3. Synchronize database tables and generate Prisma Client
echo "📦 3. Synchronizing PostgreSQL schema ledger and Prisma clients..."
(cd backend && npx prisma db push)

echo "🚀 4. Booting all 4 servers concurrently (HMR active)..."
echo "----------------------------------------------------------"
echo "   ➜  Database Server   : http://localhost:3000"
echo "   ➜  Super Admin Panel : http://localhost:3001"
echo "   ➜  Tenant Admin Desk : http://localhost:3002"
echo "   ➜  End User Portal   : http://localhost:3003"
echo "----------------------------------------------------------"

# Launch all servers concurrently with color-coded prefix logging
npx -y concurrently \
  --names "BACKEND,SUPERADMIN,TENANTADMIN,ENDUSER" \
  --prefix "name" \
  --colors "blue,magenta,cyan,green" \
  "pnpm --dir backend dev" \
  "pnpm --dir frontend/super-admin-web dev" \
  "pnpm --dir frontend/admin-web dev" \
  "pnpm --dir frontend/user-web dev"
