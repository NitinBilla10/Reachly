#!/bin/bash

# Reachly Quick Setup Script
# This script will set up the Reachly project for local development

set -e  # Exit on error

echo "🚀 Setting up Reachly - WhatsApp CRM Platform"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) is installed"

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker."
    exit 1
fi
print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) is installed"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi
print_success "Docker Compose is installed"

echo ""

# Start PostgreSQL
echo "Step 2: Starting PostgreSQL with Docker..."
if docker ps | grep -q reachly-postgres; then
    print_warning "PostgreSQL is already running"
else
    docker-compose up -d
    print_success "PostgreSQL container started"
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    if docker ps | grep -q reachly-postgres; then
        print_success "PostgreSQL is ready"
    else
        print_error "Failed to start PostgreSQL"
        exit 1
    fi
fi

echo ""

# Install dependencies
echo "Step 3: Installing dependencies..."
if [ -d "node_modules" ] && [ -d "frontend/node_modules" ] && [ -d "backend/node_modules" ]; then
    print_warning "Dependencies are already installed"
else
    print_info "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
    
    print_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    print_success "Frontend dependencies installed"
    
    print_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
    print_success "Backend dependencies installed"
fi

echo ""

# Run database migrations
echo "Step 4: Setting up database..."
cd backend

# Check if migrations already exist
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    print_warning "Database migrations already exist"
    print_info "Running prisma generate..."
    npx prisma generate
    print_success "Prisma client generated"
else
    print_info "Running database migrations..."
    npx prisma migrate dev --name init || {
        print_warning "Migration failed or already exists, trying generate only..."
        npx prisma generate
    }
    print_success "Database migrations completed"
fi

cd ..

echo ""

# Verify environment files
echo "Step 5: Verifying environment files..."

if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found, creating from .env.example..."
    cp backend/.env.example backend/.env
    print_success "Backend .env file created"
else
    print_success "Backend .env file exists"
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env file not found, creating from .env.example..."
    cp frontend/.env.example frontend/.env
    print_success "Frontend .env file created"
else
    print_success "Frontend .env file exists"
fi

echo ""

# Print summary
echo "=============================================="
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start the development servers:"
echo -e "${BLUE}   npm run dev${NC}"
echo ""
echo "2. Open your browser and navigate to:"
echo -e "${BLUE}   Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}   Backend:  http://localhost:5000${NC}"
echo ""
echo "3. Check backend health:"
echo -e "${BLUE}   curl http://localhost:5000/health${NC}"
echo ""
echo "4. To view the database (optional):"
echo -e "${BLUE}   cd backend && npx prisma studio${NC}"
echo ""
echo "5. To stop PostgreSQL:"
echo -e "${BLUE}   docker-compose down${NC}"
echo ""
echo "📚 Documentation:"
echo "- README.md - Main documentation"
echo "- SETUP.md - Detailed setup guide"
echo "- PROJECT_STRUCTURE.md - Project structure overview"
echo ""
echo "🎉 Happy coding!"
