#!/bin/bash

# =================================================================
# Unified Cookscape - Automation Deployment Script (.deploy.sh)
# =================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Deployment Process...${NC}"

# Always run from the repository root, regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 0. Cleanup Hanging Processes
echo -e "${BLUE}🧹 Cleaning up hanging processes...${NC}"
# Stop only the relevant PM2 process to avoid disrupting other apps
pm2 stop cook-backend || true

# 1. Pull Latest Changes
echo -e "${BLUE}📦 Pulling latest code from Git...${NC}"
# Clear tracked build output that can block git pull on the server
git restore dist/index.html || true
git pull origin main

# 2. Build Frontend
echo -e "${BLUE}🛠️  Building Frontend Dist...${NC}"
npm install
npm run build

# 3. Deploy Frontend Assets
echo -e "${BLUE}🚚 Copying files to /var/www/cook-frontend...${NC}"
sudo rm -rf /var/www/cook-frontend/*
sudo cp -r dist/* /var/www/cook-frontend/

# 4. Sync Backend & Database
echo -e "${BLUE}⚙️  Syncing Backend & Database...${NC}"
cd server
npm install

# Load backend environment for Prisma and database scripts
set -a
source .env
set +a

# Run the ROBUST database update script
echo -e "${BLUE}🛢️  Updating database schema safely...${NC}"
node scripts/safe_update.js

# Regenerate Prisma Client
echo -e "${BLUE}⚙️  Regenerating Prisma Client...${NC}"
npx prisma generate

# 5. Restart Server
echo -e "${BLUE}🔄 Restarting cook-backend...${NC}"
pm2 restart cook-backend

echo -e "${GREEN}✅ Deployment Complete! Visit your site to verify.${NC}"
t Complete! Visit your site to verify.${NC}"
