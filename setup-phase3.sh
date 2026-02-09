#!/bin/bash

echo "🚀 Setting up Reachly Phase 3..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites are installed${NC}"
echo ""

# Start Docker services
echo -e "${YELLOW}Starting PostgreSQL and Redis...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
if docker ps | grep -q "reachly-postgres" && docker ps | grep -q "reachly-redis"; then
    echo -e "${GREEN}✓ PostgreSQL and Redis are running${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

# Setup backend
echo ""
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please update it with your credentials.${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
npm install

# Run Prisma migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma generate
npx prisma migrate dev --name phase3_setup

# Create logs directory
mkdir -p logs
touch logs/.gitkeep

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Setup frontend
cd ../frontend
echo ""
echo -e "${YELLOW}Setting up frontend...${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
EOF
    echo -e "${GREEN}✓ .env.local file created${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Print success message
cd ..
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Reachly Phase 3 setup completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "1. Update backend/.env with your configuration"
echo -e "2. Start the backend: ${GREEN}cd backend && npm run dev${NC}"
echo -e "3. In a new terminal, start the frontend: ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}Services:${NC}"
echo -e "  - Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  - Backend API: ${GREEN}http://localhost:5000${NC}"
echo -e "  - PostgreSQL: ${GREEN}localhost:5432${NC}"
echo -e "  - Redis: ${GREEN}localhost:6379${NC}"
echo -e "  - Prometheus Metrics: ${GREEN}http://localhost:5000/monitoring/metrics${NC}"
echo ""
echo -e "${YELLOW}View services:${NC}"
echo -e "  docker ps"
echo ""
echo -e "${YELLOW}Stop services:${NC}"
echo -e "  docker-compose down"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "  - Phase 3 Features: ${GREEN}PHASE3_IMPLEMENTATION.md${NC}"
echo -e "  - Main README: ${GREEN}README.md${NC}"
echo ""
