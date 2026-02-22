# Reachly - Complete Project Structure

This document provides a detailed overview of all files and folders in the Reachly project.

## Root Directory Structure

```
reachly/
├── frontend/                    # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                # Next.js App Router Pages
│   │   ├── components/         # React Components
│   │   ├── lib/                # Utility Libraries
│   │   └── providers.tsx       # React Providers
│   ├── .env                    # Frontend Environment Variables
│   ├── .env.example            # Environment Variables Template
│   ├── .eslintrc.json          # ESLint Configuration
│   ├── next.config.js          # Next.js Configuration
│   ├── package.json            # Frontend Dependencies
│   ├── postcss.config.js       # PostCSS Configuration
│   ├── tailwind.config.js     # Tailwind CSS Configuration
│   └── tsconfig.json           # TypeScript Configuration
│
├── backend/                     # Express Backend API
│   ├── src/
│   │   ├── middleware/         # Express Middleware
│   │   ├── routes/             # API Routes
│   │   ├── services/           # Business Logic Services
│   │   ├── validation/         # Input Validation Schemas
│   │   └── server.ts           # Server Entry Point
│   ├── prisma/
│   │   └── schema.prisma       # Prisma Database Schema
│   ├── .env                    # Backend Environment Variables
│   ├── .env.example            # Environment Variables Template
│   ├── package.json            # Backend Dependencies
│   └── tsconfig.json           # TypeScript Configuration
│
├── docker/                      # Docker Configuration
├── docker-compose.yml          # Docker Compose Configuration
├── .gitignore                   # Git Ignore Rules
├── package.json                 # Root Package (Workspaces)
├── README.md                    # Main Documentation
└── SETUP.md                     # Setup Guide
```

## Frontend Directory Details

### `frontend/src/app/` - Next.js App Router Pages

```
app/
├── auth/                        # Authentication Pages
│   ├── layout.tsx              # Auth Layout Wrapper
│   ├── login/
│   │   └── page.tsx            # Login Page
│   └── signup/
│       └── page.tsx            # Signup Page
│
├── dashboard/                   # Dashboard Pages
│   ├── layout.tsx              # Dashboard Layout (Sidebar + Topbar)
│   ├── page.tsx                # Dashboard Overview
│   ├── analytics/               # Analytics Pages
│   ├── campaigns/               # Campaign Management Pages
│   ├── customers/               # Customer Management Pages
│   ├── inbox/                  # Shared Inbox Pages
│   ├── settings/               # Settings Pages
│   ├── tags/                   # Tag Management Pages
│   └── templates/              # Template Management Pages
│
├── globals.css                  # Global Styles & Tailwind
├── layout.tsx                   # Root Layout
└── page.tsx                     # Landing Page
```

### `frontend/src/components/` - React Components

```
components/
├── layout/                      # Layout Components
│   ├── sidebar.tsx             # Dashboard Sidebar Navigation
│   └── topbar.tsx              # Dashboard Top Bar
│
├── ui/                          # UI Components (Radix UI)
│   ├── avatar.tsx              # Avatar Component
│   ├── badge.tsx               # Badge Component
│   ├── button.tsx              # Button Component
│   ├── card.tsx                # Card Component
│   ├── input.tsx               # Input Component
│   ├── label.tsx               # Label Component
│   ├── progress.tsx            # Progress Bar Component
│   ├── scroll-area.tsx         # Scroll Area Component
│   ├── select.tsx              # Select Dropdown Component
│   ├── separator.tsx           # Separator Component
│   ├── switch.tsx              # Toggle Switch Component
│   ├── table.tsx               # Table Component
│   ├── tabs.tsx                # Tabs Component
│   └── textarea.tsx            # Textarea Component
│
└── theme-toggle.tsx             # Dark/Light Theme Toggle
```

### `frontend/src/lib/` - Utility Libraries

```
lib/
├── api.ts                       # Axios API Client with interceptors
├── socket.ts                    # Socket.io WebSocket Client
└── utils.ts                     # Utility Functions
```

**Key functions in `utils.ts`:**
- `cn()` - Class name merging with clsx and tailwind-merge
- `formatDate()` - Date formatting
- `formatDateTime()` - Date and time formatting
- `formatPhoneNumber()` - Phone number formatting
- `generateId()` - Random ID generation
- `truncateText()` - Text truncation
- `capitalizeFirst()` - String capitalization
- `formatCurrency()` - Currency formatting
- `validateEmail()` - Email validation
- `validatePhoneNumber()` - Phone number validation
- `extractTemplateVariables()` - Extract template variables
- `replaceTemplateVariables()` - Replace template variables
- `getInitials()` - Get initials from name
- `debounce()` - Debounce function
- `throttle()` - Throttle function
- `sleep()` - Async sleep function
- `isToday()` - Check if date is today
- `formatRelativeTime()` - Relative time formatting
- `downloadCSV()` - Download data as CSV

## Backend Directory Details

### `backend/src/middleware/` - Express Middleware

```
middleware/
├── auth.ts                      # JWT Authentication Middleware
│   ├── authenticateToken()     # Verify JWT token
│   └── generateToken()         # Generate JWT token
│
└── errorHandler.ts              # Global Error Handler
    ├── errorHandler()          # Error handling middleware
    └── createError()           # Create custom errors
```

### `backend/src/routes/` - API Routes

```
routes/
├── analytics.ts                 # Analytics Endpoints
│   ├── GET /analytics/overview  # Dashboard overview
│   ├── GET /analytics/messages  # Message analytics
│   ├── GET /analytics/campaigns # Campaign analytics
│   ├── GET /analytics/customers # Customer analytics
│   ├── GET /analytics/templates # Template analytics
│   └── GET /analytics/conversations # Conversation analytics
│
├── auth.ts                      # Authentication Endpoints
│   ├── POST /auth/register     # Register new user
│   ├── POST /auth/login        # Login user
│   ├── GET /auth/profile       # Get user profile
│   └── PUT /auth/profile       # Update user profile
│
├── campaigns.ts                 # Campaign Endpoints
│   ├── GET /campaigns          # Get all campaigns
│   ├── GET /campaigns/:id      # Get campaign by ID
│   ├── POST /campaigns         # Create campaign
│   ├── POST /campaigns/:id/send # Send campaign
│   ├── PUT /campaigns/:id/cancel # Cancel campaign
│   └── GET /campaigns/:id/analytics # Campaign analytics
│
├── customers.ts                 # Customer Endpoints
│   ├── GET /customers          # Get all customers (paginated)
│   ├── GET /customers/:id      # Get customer by ID
│   ├── POST /customers         # Create customer
│   ├── PUT /customers/:id      # Update customer
│   └── DELETE /customers/:id   # Delete customer
│
├── messages.ts                  # Message Endpoints
│   ├── GET /messages/conversations # Get all conversations
│   ├── GET /messages/conversations/:id/messages # Get messages
│   ├── POST /messages/send     # Send message
│   ├── PUT /messages/:id/read  # Mark as read
│   ├── PUT /messages/conversations/:id/archive # Archive
│   ├── PUT /messages/conversations/:id/unarchive # Unarchive
│   ├── GET /messages/unread-count # Unread count
│   └── GET /messages/search    # Search messages
│
├── settings.ts                  # Settings Endpoints
│   ├── GET /settings/whatsapp  # Get WhatsApp credentials
│   ├── POST /settings/whatsapp # Update credentials
│   ├── DELETE /settings/whatsapp # Delete credentials
│   ├── POST /settings/whatsapp/test # Test connection
│   ├── GET /settings/profile   # Get profile with stats
│   ├── PUT /settings/profile   # Update profile
│   └── PUT /settings/password  # Change password
│
├── tags.ts                      # Tag Endpoints
│   ├── GET /tags               # Get all tags
│   ├── POST /tags              # Create tag
│   ├── PUT /tags/:id           # Update tag
│   ├── DELETE /tags/:id        # Delete tag
│   └── GET /tags/:id/customers # Get customers by tag
│
├── templates.ts                 # Template Endpoints
│   ├── GET /templates          # Get all templates
│   ├── GET /templates/:id      # Get template by ID
│   ├── POST /templates         # Create template
│   ├── PUT /templates/:id      # Update template
│   ├── DELETE /templates/:id   # Delete template
│   ├── POST /templates/:id/sync # Sync with WhatsApp
│   └── POST /templates/:id/preview # Preview with variables
│
└── webhooks.ts                  # Webhook Endpoints
    ├── GET /webhooks/whatsapp  # Verify webhook
    └── POST /webhooks/whatsapp # Handle webhook events
```

### `backend/src/services/` - Business Logic

```
services/
├── database.ts                  # Prisma Client Instance
│   └── prisma                  # Singleton Prisma client
│
├── encryption.ts                # Encryption Service
│   ├── EncryptionService.encrypt()
│   ├── EncryptionService.decrypt()
│   └── EncryptionService.hash()
│
├── socket.ts                    # Socket.io Service
│   ├── SocketService class
│   ├── initializeSocket()      # Initialize Socket.io
│   └── getSocketService()      # Get Socket.io instance
│
└── whatsapp.ts                 # WhatsApp API Service
    ├── WhatsAppService class
    ├── getCredentials()       # Get encrypted credentials
    ├── sendTextMessage()      # Send text message
    ├── sendTemplateMessage()  # Send template message
    ├── getMessageStatus()     # Get message status
    └── verifyWebhook()        # Verify webhook token
```

### `backend/src/validation/` - Input Validation

```
validation/
├── auth.ts                      # Auth Validation Schemas
│   ├── registerSchema          # Registration validation
│   ├── loginSchema             # Login validation
│   └── updateProfileSchema     # Profile update validation
│
└── common.ts                    # Common Validation Schemas
    ├── createCustomerSchema
    ├── updateCustomerSchema
    ├── createTagSchema
    ├── updateTagSchema
    ├── createTemplateSchema
    ├── updateTemplateSchema
    ├── createCampaignSchema
    ├── sendMessageSchema
    └── updateWhatsAppCredentialsSchema
```

### `backend/src/server.ts` - Server Entry Point

```typescript
// Main Express server with:
// - CORS configuration
// - Helmet security
// - Compression
// - Rate limiting
// - Request logging (Morgan)
// - All routes mounted
// - Socket.io integration
// - Error handling
```

### `backend/prisma/schema.prisma` - Database Schema

**Models:**
- `User` - User accounts and authentication
- `WhatsAppCredentials` - Encrypted WhatsApp API credentials
- `Customer` - Customer contact information
- `Tag` - Customer segmentation tags
- `CustomerTag` - Customer-Tag many-to-many relationship
- `Template` - Message templates
- `Campaign` - Bulk messaging campaigns
- `CampaignMessage` - Individual campaign messages
- `Conversation` - Chat conversation threads
- `Message` - Individual messages

## Configuration Files

### Root `package.json` - Workspace Configuration

```json
{
  "name": "reachly",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "cd frontend && npm run build && cd ../backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "prisma:generate": "npm --workspace backend run prisma:generate",
    "prisma:migrate": "npm --workspace backend run prisma:migrate",
    "prisma:studio": "npm --workspace backend run prisma:studio"
  },
  "workspaces": ["frontend", "backend"]
}
```

### `docker-compose.yml` - Docker Configuration

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: reachly
      POSTGRES_PASSWORD: reachly_password_123
      POSTGRES_DB: reachly_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## Environment Variables

### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Reachly
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_CAMPAIGNS=true
```

### Backend (.env)

```env
DATABASE_URL="postgresql://reachly:reachly_password_123@localhost:5432/reachly_db"
JWT_SECRET="your-super-secret-jwt-key"
ENCRYPTION_KEY="your-32-character-encryption-key"
WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
WHATSAPP_API_VERSION="v17.0"
WHATSAPP_BASE_URL="https://graph.facebook.com"
MAX_FILE_SIZE=10485760
```

## Key Dependencies

### Frontend Dependencies

- **next**: 16.0.0 - React framework
- **react**: ^18.2.0 - React library
- **tailwindcss**: ^3.4.1 - CSS framework
- **@radix-ui/*** - UI component primitives
- **axios**: ^1.6.2 - HTTP client
- **socket.io-client**: ^4.7.4 - WebSocket client
- **recharts**: ^2.8.0 - Charts library
- **framer-motion**: ^10.16.16 - Animation library
- **@tanstack/react-query**: ^5.12.2 - Data fetching
- **zustand**: ^4.4.7 - State management
- **next-themes**: ^0.2.1 - Theme management
- **react-hot-toast**: ^2.4.1 - Toast notifications

### Backend Dependencies

- **express**: ^4.18.2 - Web framework
- **@prisma/client**: ^5.7.1 - Database ORM
- **socket.io**: ^4.7.4 - WebSocket server
- **bcryptjs**: ^2.4.3 - Password hashing
- **jsonwebtoken**: ^9.0.2 - JWT authentication
- **cors**: ^2.8.5 - CORS middleware
- **helmet**: ^7.1.0 - Security headers
- **express-rate-limit**: ^7.1.5 - Rate limiting
- **zod**: ^3.22.4 - Schema validation
- **dotenv**: ^16.3.1 - Environment variables
- **crypto-js**: ^4.2.0 - Encryption
- **axios**: ^1.6.2 - HTTP client
- **morgan**: ^1.10.0 - Request logging
- **compression**: ^1.7.4 - Response compression

## File Count Summary

- **Frontend files**: ~50+ files
- **Backend files**: ~30+ files
- **Configuration files**: ~15 files
- **Total**: ~95+ files

## Key Features Implementation

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- Token refresh mechanism

### Real-time Communication
- Socket.io for WebSocket connections
- Real-time message notifications
- Typing indicators
- Conversation updates

### Database
- Prisma ORM with PostgreSQL
- Type-safe database queries
- Migration management
- Relationship handling

### API Design
- RESTful API endpoints
- Request validation with Zod
- Error handling middleware
- Rate limiting

### Frontend Architecture
- Next.js App Router
- Server and client components
- API routes for server-side calls
- Client-side data fetching with React Query

### Security
- CORS protection
- Helmet security headers
- Encrypted sensitive data
- SQL injection prevention (Prisma)

## Development Workflow

1. **Start PostgreSQL**: `docker-compose up -d`
2. **Install dependencies**: `npm install`
3. **Run migrations**: `cd backend && npx prisma migrate dev`
4. **Start servers**: `npm run dev`
5. **Access frontend**: http://localhost:3000
6. **Access backend**: http://localhost:5000
7. **View database**: `cd backend && npx prisma studio`

## Testing Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

This structure provides a solid foundation for a full-stack WhatsApp CRM application with all the necessary components for development, testing, and deployment.
