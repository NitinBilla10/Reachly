# 🚀 Reachly - Quick Start Guide

## One-Command Setup

```bash
./setup.sh
npm run dev
```

That's it! The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Manual Setup (3 Steps)

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Migrations & Start
```bash
cd backend
npx prisma migrate dev --name init
cd ..
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Database Studio**: Run `cd backend && npx prisma studio` (opens at http://localhost:5555)

## Available Commands

### Root Commands
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build            # Build both for production
```

### Backend Commands
```bash
cd backend
npm run dev              # Start development server
npm run build            # Build TypeScript
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database UI
```

### Frontend Commands
```bash
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

## Docker Commands

```bash
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop PostgreSQL
docker-compose logs      # View logs
docker ps               # Check running containers
```

## First Time Usage

1. **Register a user** at http://localhost:3000/auth/signup
2. **Login** with your credentials
3. **Explore the dashboard**
4. **Add customers** in the Customers section
5. **Create tags** for segmentation
6. **Build templates** for messages
7. **Create campaigns** and send bulk messages

## Database Management

### View Database
```bash
cd backend
npx prisma studio
```

### Reset Database (⚠️ Deletes all data)
```bash
cd backend
npx prisma migrate reset
```

### Create New Migration
```bash
cd backend
npx prisma migrate dev --name describe_your_change
```

## Troubleshooting

### Database Connection Error
```bash
docker-compose restart
```

### Port Already in Use
```bash
# Find and kill process using port 3000 or 5000
lsof -ti:3000 | xargs kill -9
```

### Fresh Start
```bash
# Stop everything
docker-compose down

# Remove volumes (⚠️ Deletes database)
docker-compose down -v

# Clean and reinstall
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
npm install
```

## Testing API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Documentation

- **README.md** - Comprehensive documentation
- **SETUP.md** - Detailed setup guide
- **PROJECT_STRUCTURE.md** - Complete file structure
- **DELIVERABLES.md** - All deliverables list

## Key Features

✅ WhatsApp Business API Integration
✅ Customer Management with Tags
✅ Bulk Messaging Campaigns
✅ Message Templates
✅ Real-time Chat (Socket.io)
✅ Analytics Dashboard
✅ Multi-language Ready
✅ Secure Authentication
✅ Responsive Design
✅ Dark/Light Theme

## Tech Stack

**Frontend**: Next.js 16, TypeScript, Tailwind CSS, Radix UI, Socket.io Client
**Backend**: Express, TypeScript, Prisma, PostgreSQL, Socket.io, JWT
**DevOps**: Docker, Docker Compose, PostgreSQL 15

## Support

For detailed information:
1. Read SETUP.md for troubleshooting
2. Check README.md for API documentation
3. Review PROJECT_STRUCTURE.md for code organization

---

**Happy Coding!** 🎉
