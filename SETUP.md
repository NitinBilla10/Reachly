# Reachly Setup Guide

This guide will help you set up and run the Reachly WhatsApp CRM platform on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18 or higher** - [Download here](https://nodejs.org/)
- **Docker and Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com/downloads)

Verify installations:

```bash
node --version  # Should be v18.x or higher
docker --version
docker-compose --version
git --version
```

## Step-by-Step Setup

### Step 1: Clone and Navigate to Project

```bash
git clone <repository-url>
cd reachly
```

### Step 2: Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This command:
- Downloads the PostgreSQL 15 Docker image (if not already downloaded)
- Starts the PostgreSQL container in detached mode
- Exposes PostgreSQL on port 5432
- Creates a volume for persistent data storage

Verify PostgreSQL is running:

```bash
docker ps
```

You should see a container named `reachly-postgres` with status `Up`.

### Step 3: Install Dependencies

Install all project dependencies:

```bash
npm install
```

This will:
- Install root dependencies (concurrently)
- Install frontend dependencies
- Install backend dependencies

### Step 4: Verify Environment Files

Environment files are already configured, but you should verify them:

**Check `backend/.env`:**
```bash
cat backend/.env
```

You should see:
```env
DATABASE_URL="postgresql://reachly:reachly_password_123@localhost:5432/reachly_db"
JWT_SECRET="reachly-super-secret-jwt-key-change-in-production-2024"
ENCRYPTION_KEY="32-char-encryption-key-1234567890"
WEBHOOK_VERIFY_TOKEN="reachly-webhook-verify-token-2024"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

**Check `frontend/.env`:**
```bash
cat frontend/.env
```

You should see:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Reachly
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Run Database Migrations

Initialize the database with Prisma:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

This will:
- Create all database tables based on the Prisma schema
- Generate the Prisma client
- Create a migration file in `backend/prisma/migrations/`

### Step 6: Start Development Servers

Start both frontend and backend servers:

```bash
npm run dev
```

You should see output indicating both servers are starting:

```
[0] ⚠  Starting...
[0] ⚠ Ready! Available at http://localhost:3000
[1] 🚀 Reachly Backend running on port 5000
[1] 📊 Environment: development
```

### Step 7: Verify the Application

**1. Check the frontend:**
Open your browser and navigate to:
```
http://localhost:3000
```

You should see the Reachly landing page with features, pricing, and testimonials.

**2. Check the backend:**
Test the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-XX-XX..."
}
```

**3. Test authentication:**
Try registering a new user (you can use the UI or test via API):

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

## Using the Application

### 1. Create an Account

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign up"
3. Fill in your information:
   - First name
   - Last name
   - Email
   - Password (minimum 8 characters)
   - Company name
4. Click "Create account"

### 2. Explore the Dashboard

After logging in, you'll see the dashboard with:
- Overview statistics
- Recent campaigns
- Message analytics

### 3. Add Customers

1. Go to "Customers" in the sidebar
2. Click "Add Customer"
3. Fill in customer details:
   - Name
   - Phone number (with country code, e.g., +1234567890)
   - Email (optional)
   - Notes (optional)
   - Tags (optional)
4. Click "Save"

### 4. Create Tags

1. Go to "Tags" in the sidebar
2. Click "Add Tag"
3. Enter:
   - Tag name (e.g., "VIP Customers")
   - Color (e.g., "#FF5733")
   - Description (optional)
4. Click "Save"

### 5. Create Templates

1. Go to "Templates" in the sidebar
2. Click "Add Template"
3. Fill in:
   - Template name
   - Category (marketing/utility/authentication)
   - Language
   - Content (use {{variable}} for dynamic values)
4. Click "Save"

### 6. Create and Send Campaigns

1. Go to "Bulk Messaging" in the sidebar
2. Click "Create Campaign"
3. Fill in:
   - Campaign name
   - Description (optional)
   - Select a template
   - Choose tags for targeting
   - Schedule (optional)
4. Click "Create"
5. To send the campaign, click "Send Campaign"

### 7. Monitor Messages

1. Go to "Shared Inbox" in the sidebar
2. View all conversations
3. Click on a conversation to see messages
4. Send messages to customers directly

### 8. Configure WhatsApp (Optional)

To use actual WhatsApp messaging:

1. Go to "Settings" in the sidebar
2. Navigate to "WhatsApp Integration"
3. Enter your WhatsApp Business API credentials:
   - Access Token
   - Phone Number ID
   - Business ID
4. Click "Save"
5. Test the connection

## Common Tasks

### View Database with Prisma Studio

```bash
cd backend
npx prisma studio
```

This opens a web-based database viewer at http://localhost:5555

### Reset the Database

```bash
cd backend
npx prisma migrate reset
```

⚠️ **Warning:** This will delete all data!

### Check Database Logs

```bash
docker logs reachly-postgres
```

### Stop PostgreSQL Container

```bash
docker-compose down
```

### Start PostgreSQL Container

```bash
docker-compose up -d
```

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running: `docker ps`
2. Check database logs: `docker logs reachly-postgres`
3. Verify DATABASE_URL in `backend/.env`
4. Restart the container: `docker-compose restart`

### Issue: "Port 3000/5000 already in use"

**Solution:**
1. Find the process using the port:
   ```bash
   lsof -i :3000  # or :5000
   ```
2. Kill the process or change the port in `.env` files

### Issue: "Prisma client not generated"

**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue: "Migration failed"

**Solution:**
1. Reset the database:
   ```bash
   cd backend
   npx prisma migrate reset
   ```
2. Or create a fresh migration:
   ```bash
   npx prisma migrate dev --name init
   ```

### Issue: "Module not found" errors

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
npm install
```

### Issue: "WebSocket connection failed"

**Solution:**
1. Verify NEXT_PUBLIC_WS_URL in `frontend/.env`
2. Check that the backend is running on port 5000
3. Check browser console for specific errors

## Development Tips

### Hot Reload

Both frontend and backend support hot reload. Changes you make will be reflected immediately.

### Type Checking

Run TypeScript type checking:

```bash
# Frontend
cd frontend
npm run type-check

# Backend
cd backend
npm run build  # This will also type-check
```

### Linting

Run ESLint:

```bash
# Frontend
cd frontend
npm run lint

# Backend
npm run lint  # if configured
```

### Database Schema Changes

When modifying `backend/prisma/schema.prisma`:

1. Save your changes
2. Create a migration:
   ```bash
   cd backend
   npx prisma migrate dev --name describe_your_change
   ```
3. Regenerate the Prisma client:
   ```bash
   npx prisma generate
   ```

## Next Steps

1. **Explore the codebase** - Read through the source code to understand the architecture
2. **Customize the UI** - Modify components in `frontend/src/components`
3. **Add features** - Implement new routes or functionality
4. **Set up WhatsApp** - Configure real WhatsApp Business API credentials
5. **Deploy** - Deploy to your preferred hosting platform

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)

## Support

If you encounter any issues not covered in this guide:

1. Check the main [README.md](./README.md)
2. Review error messages carefully
3. Check Docker and Node.js logs
4. Open an issue on GitHub

---

Happy coding! 🚀
