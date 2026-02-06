# Reachly - WhatsApp Business API SaaS Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Reachly is a comprehensive SaaS platform that allows businesses to send and manage WhatsApp Business API messages to their customers. Built with modern web technologies, it provides a complete solution for customer communication, marketing campaigns, and analytics.

## 🚀 Project Overview

Reachly is a production-grade SaaS application that enables businesses to:

- **Connect WhatsApp Business API** - Securely integrate and manage WhatsApp Business credentials
- **Customer Management** - Organize customers with detailed profiles, tags, and notes
- **Template System** - Create and manage WhatsApp message templates with variables
- **Bulk Messaging** - Send targeted campaigns to customer segments using tags
- **Real-time Chat** - Shared inbox interface for customer conversations
- **Analytics Dashboard** - Track message delivery, engagement, and campaign performance
- **Multi-tenant Architecture** - Complete data isolation between user accounts

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern React component library
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Recharts** - Chart library for analytics
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling with validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Zod** - Schema validation

### Security & Infrastructure
- **AES Encryption** - WhatsApp credentials encryption
- **Rate Limiting** - API protection
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **HTTPS Only Cookies** - Secure cookie handling

### Deployment
- **Frontend** - Vercel
- **Backend** - Render/Railway/Fly.io
- **Database** - Managed PostgreSQL (Supabase/Neon/RDS)

## 📋 Features

### 🔐 Authentication & Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (User level)
- Secure session management
- Multi-tenant data isolation
- Encrypted WhatsApp credentials storage

### 👥 Customer Management (Mini CRM)
- Add/edit/delete customers
- Customer profiles with:
  - Name, phone number, email
  - Custom notes
  - Tag assignments
- Phone number validation (international format)
- Search and filter customers
- Import/export capabilities

### 🏷️ Tagging System
- Create custom tags with colors
- Assign multiple tags to customers
- Filter customers by tags
- Tag-based campaign targeting
- Tag analytics and usage statistics

### 📝 Template Management
- WhatsApp template creation and management
- Variable support (e.g., `{{name}}`, `{{order_id}}`)
- Template categories:
  - Marketing
  - Utility
  - Authentication
- Multi-language support
- Template preview with variables
- WhatsApp API sync (pending approval)

### 📢 Bulk Messaging Campaigns
- Create campaigns with templates
- Target customers by tags
- Personalized message variables
- Campaign scheduling
- Real-time progress tracking
- Delivery status monitoring
- Campaign analytics and reporting

### 💬 Real-time Chat Inbox
- WhatsApp-style chat interface
- Real-time message synchronization
- Typing indicators
- Message status updates
- Conversation management
- Search through conversations
- File attachment support

### 📊 Analytics Dashboard
- Message delivery rates
- Campaign performance metrics
- Customer engagement analytics
- Response time tracking
- Template usage statistics
- Interactive charts and graphs

### ⚙️ Settings Management
- WhatsApp API credentials management
- User profile settings
- Webhook configuration
- API testing and validation
- Security settings

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • User Data     │
│ • Chat UI       │    │ • WebSocket     │    │ • Messages      │
│ • Analytics     │    │ • Webhooks      │    │ • Customers     │
│ • Settings      │    │ • Auth          │    │ • Templates     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐              
│   WhatsApp      │    │   Deployment    │              
│   Business API  │    │                 │              
│                 │    │ • Vercel        │              
│ • Send Messages │    │ • Render        │              
│ • Webhooks      │    │ • Supabase      │              
│ • Templates     │    │                 │              
└─────────────────┘    └─────────────────┘              
```

## 📊 Database Schema

### Core Tables

#### Users
```sql
- id (String, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- firstName (String)
- lastName (String)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### WhatsApp Credentials (Encrypted)
```sql
- id (String, Primary Key)
- userId (String, Foreign Key)
- accessToken (String, Encrypted)
- phoneNumberId (String)
- businessId (String)
- webhookVerifyToken (String)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Customers
```sql
- id (String, Primary Key)
- userId (String, Foreign Key)
- name (String)
- phone (String, Unique)
- email (String, Optional)
- notes (String, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Tags
```sql
- id (String, Primary Key)
- userId (String, Foreign Key)
- name (String)
- color (String, Default: #3B82F6)
- description (String, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Templates
```sql
- id (String, Primary Key)
- userId (String, Foreign Key)
- name (String)
- category (String: marketing, utility, authentication)
- language (String, Default: en_US)
- content (String)
- variables (JSON, Optional)
- whatsappTemplateId (String, Optional)
- status (String, Default: pending)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Campaigns
```sql
- id (String, Primary Key)
- userId (String, Foreign Key)
- name (String)
- description (String, Optional)
- templateId (String, Foreign Key)
- status (String: draft, sending, completed, failed)
- totalMessages (Integer)
- sentMessages (Integer)
- deliveredMessages (Integer)
- failedMessages (Integer)
- scheduledAt (DateTime, Optional)
- startedAt (DateTime, Optional)
- completedAt (DateTime, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Messages
```sql
- id (String, Primary Key)
- conversationId (String, Foreign Key)
- customerId (String, Foreign Key)
- templateId (String, Foreign Key, Optional)
- content (String)
- messageType (String: text, template, image, document)
- direction (String: inbound, outbound)
- whatsappMessageId (String, Optional)
- status (String: sent, delivered, read, failed)
- sentAt (DateTime)
- deliveredAt (DateTime, Optional)
- readAt (DateTime, Optional)
- failedAt (DateTime, Optional)
- error (String, Optional)
- metadata (JSON, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

## 🔧 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/reachly_db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Encryption Key for WhatsApp credentials (generate a secure random string)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# WhatsApp Webhook Verification Token
WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token-here"

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WhatsApp API Configuration
WHATSAPP_API_VERSION="v17.0"
WHATSAPP_BASE_URL="https://graph.facebook.com"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_WS_URL="http://localhost:5000"
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd reachly
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Database Setup

#### Local PostgreSQL
```bash
# Create database
createdb reachly_db

# Run migrations
cd backend
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio
npx prisma studio
```

#### Managed Database (Recommended)
1. Create a database on Supabase, Neon, or RDS
2. Update `DATABASE_URL` in backend `.env`
3. Run migrations:
```bash
cd backend
npx prisma migrate deploy
```

### 4. Environment Configuration

#### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

#### Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 5. Run Development Servers

#### Option 1: Run Both Simultaneously
```bash
# From root directory
npm run dev
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Backend Health: http://localhost:5000/health

## 📱 Pages & Features

### Landing Page (`/`)
- Marketing website with feature highlights
- Pricing plans
- Customer testimonials
- Call-to-action for sign up

### Authentication
- **Login** (`/auth/login`) - User authentication
- **Sign Up** (`/auth/signup`) - New user registration

### Dashboard
- **Home** (`/dashboard`) - Overview and quick stats
- **Analytics** (`/dashboard/analytics`) - Detailed analytics dashboard

### Customer Management
- **Customers** (`/dashboard/customers`) - Customer list and management
- **Add Customer** (`/dashboard/customers/new`) - Create new customer
- **Edit Customer** (`/dashboard/customers/[id]`) - Edit customer details

### Communication
- **Templates** (`/dashboard/templates`) - Message template management
- **Campaigns** (`/dashboard/campaigns`) - Bulk messaging campaigns
- **Inbox** (`/dashboard/inbox`) - Real-time chat interface

### Organization
- **Tags** (`/dashboard/tags`) - Tag management
- **Settings** (`/dashboard/settings`) - App and WhatsApp settings

## 🔌 API Endpoints

### Authentication
```
POST /auth/register     - Register new user
POST /auth/login        - User login
GET  /auth/profile      - Get user profile
PUT  /auth/profile      - Update user profile
```

### Customers
```
GET    /customers              - Get all customers
POST   /customers              - Create customer
GET    /customers/:id          - Get customer by ID
PUT    /customers/:id          - Update customer
DELETE /customers/:id          - Delete customer
```

### Tags
```
GET  /tags               - Get all tags
POST /tags               - Create tag
PUT  /tags/:id           - Update tag
DELETE /tags/:id         - Delete tag
GET  /tags/:id/customers - Get customers by tag
```

### Templates
```
GET  /templates              - Get all templates
POST /templates              - Create template
GET  /templates/:id          - Get template by ID
PUT  /templates/:id          - Update template
DELETE /templates/:id        - Delete template
POST /templates/:id/sync     - Sync with WhatsApp
POST /templates/:id/preview  - Preview template with variables
```

### Campaigns
```
GET  /campaigns                  - Get all campaigns
POST /campaigns                  - Create campaign
POST /campaigns/:id/send         - Send campaign
PUT  /campaigns/:id/cancel       - Cancel campaign
GET  /campaigns/:id/analytics    - Get campaign analytics
```

### Messages
```
GET  /messages/conversations              - Get all conversations
GET  /messages/conversations/:id/messages  - Get conversation messages
POST /messages/send                        - Send message
PUT  /messages/:id/read                   - Mark message as read
PUT  /messages/conversations/:id/archive - Archive conversation
GET  /messages/unread-count               - Get unread count
```

### Settings
```
GET  /settings/whatsapp      - Get WhatsApp credentials
POST /settings/whatsapp      - Update WhatsApp credentials
DELETE /settings/whatsapp    - Delete WhatsApp credentials
POST /settings/whatsapp/test - Test WhatsApp connection
GET  /settings/profile       - Get user profile
PUT  /settings/profile      - Update user profile
```

### Analytics
```
GET /analytics/overview      - Dashboard overview
GET /analytics/messages      - Message analytics
GET /analytics/campaigns     - Campaign analytics
GET /analytics/customers     - Customer analytics
GET /analytics/templates     - Template analytics
GET /analytics/conversations - Conversation analytics
```

### Webhooks
```
GET  /webhooks/whatsapp      - WhatsApp webhook verification
POST /webhooks/whatsapp      - WhatsApp webhook handler
```

## 🔐 Security Features

### WhatsApp Credentials Protection
- **AES Encryption**: All WhatsApp access tokens are encrypted before database storage
- **Server-side Only**: Encrypted credentials never exposed to frontend
- **Secure Storage**: Database-level encryption for sensitive data

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds for password security
- **Session Management**: Secure HTTP-only cookies
- **Multi-tenant Isolation**: Users can only access their own data

### API Security
- **Rate Limiting**: Prevent abuse with request limits
- **Input Validation**: Zod schemas for all API inputs
- **CORS Configuration**: Controlled cross-origin requests
- **Helmet.js**: Security headers and protection
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 📈 Performance & Scalability

### Backend Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis support for session and data caching
- **Compression**: Gzip compression for API responses
- **Rate Limiting**: Prevent API abuse

### Frontend Optimizations
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Webpack bundle analyzer
- **Progressive Loading**: Skeleton screens and loading states
- **Responsive Design**: Mobile-first responsive design

## 🚀 Deployment

### Frontend Deployment (Vercel)

#### 1. Prepare for Deployment
```bash
cd frontend
npm run build
```

#### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### 3. Environment Variables (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_WS_URL=https://your-backend-url.com
```

### Backend Deployment (Render)

#### 1. Prepare for Deployment
```bash
cd backend
npm run build
```

#### 2. Deploy to Render
1. Create account on Render.com
2. Connect your GitHub repository
3. Create new Web Service
4. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables in Render dashboard

#### 3. Environment Variables (Render)
```bash
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-production-encryption-key
WEBHOOK_VERIFY_TOKEN=your-webhook-token
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Database Deployment

#### Option 1: Supabase (Recommended)
1. Create account on Supabase
2. Create new project
3. Get connection string
4. Run migrations:
```bash
cd backend
npx prisma migrate deploy
```

#### Option 2: Neon
1. Create account on Neon.tech
2. Create new database
3. Get connection string
4. Run migrations

#### Option 3: AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Get connection details
4. Run migrations

## 🔧 WhatsApp API Setup

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add WhatsApp Business API product
4. Get temporary access token

### 2. Configure Webhook
1. In your Facebook app, go to WhatsApp API Setup
2. Add webhook URL: `https://your-backend-domain.com/webhooks/whatsapp`
3. Set verify token (same as in your environment)
4. Subscribe to events:
   - messages
   - message_deliveries
   - message_reads
   - message_failures

### 3. Get Permanent Credentials
1. Complete Facebook business verification
2. Get permanent access token
3. Get phone number ID and business ID
4. Update credentials in Reachly settings

### 4. Template Approval Process
1. Create templates in Reachly
2. Sync with WhatsApp API
3. Templates go to "Pending" status
4. Facebook reviews and approves templates
5. Approved templates can be used in campaigns

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### End-to-End Testing
```bash
# Install Playwright
npm install -g @playwright/test

# Run E2E tests
npx playwright test
```

## 📝 Development Guidelines

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks

### Git Workflow
1. Create feature branch from `main`
2. Make changes with proper commits
3. Create pull request with description
4. Code review and approval
5. Merge to `main`

### Commit Messages
```
feat: add new customer import feature
fix: resolve authentication token expiry issue
docs: update API documentation for campaigns
style: improve dashboard layout responsiveness
refactor: optimize database queries for customers
test: add unit tests for message service
```

## 🔮 Future Improvements

### Short-term
- [ ] File attachment support in chat
- [ ] Message scheduling
- [ ] Customer segmentation based on behavior
- [ ] Advanced analytics with custom reports
- [ ] Mobile app (React Native)

### Long-term
- [ ] Multi-language support
- [ ] Advanced automation workflows
- [ ] Integration with other platforms (Shopify, Salesforce)
- [ ] AI-powered message suggestions
- [ ] White-label solution
- [ ] Advanced user roles and permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- **Email**: support@reachly.com
- **Documentation**: [docs.reachly.com](https://docs.reachly.com)
- **Discord**: [Join our community](https://discord.gg/reachly)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://prisma.io/) for database ORM
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp) for messaging platform

---

**Built with ❤️ by the Reachly team**