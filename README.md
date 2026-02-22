# Reachly - WhatsApp Business API CRM Platform

A full-stack WhatsApp Business API CRM platform that helps businesses manage customer communications, send bulk messages, and track campaign performance.

## 🚀 Features

- **WhatsApp Business API Integration** - Connect and manage your WhatsApp Business API credentials
- **Customer Management** - Organize customers with tags, notes, and detailed profiles
- **Bulk Messaging** - Send personalized messages to thousands of customers instantly
- **Template Management** - Create and manage WhatsApp message templates with variables
- **Campaign Analytics** - Track message delivery, engagement, and campaign performance
- **Real-time Chat** - Shared inbox for managing conversations in real-time
- **Message Templates** - Create reusable message templates with dynamic variables
- **Tag System** - Organize customers into segments for targeted messaging
- **Dashboard Analytics** - Comprehensive analytics and reporting
- **Multi-user Support** - Team collaboration with role-based access

## 🛠 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Query** - Data fetching and caching
- **Recharts** - Charts and analytics
- **Framer Motion** - Animations

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **Prisma** - ORM for database operations
- **PostgreSQL** - Relational database
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Input validation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL 15** - Database

## 📁 Project Structure

```
reachly/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── auth/         # Authentication pages
│   │   │   │   ├── login/    # Login page
│   │   │   │   └── signup/   # Signup page
│   │   │   ├── dashboard/    # Dashboard pages
│   │   │   │   ├── analytics/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── customers/
│   │   │   │   ├── inbox/
│   │   │   │   ├── settings/
│   │   │   │   ├── tags/
│   │   │   │   └── templates/
│   │   │   ├── globals.css   # Global styles
│   │   │   ├── layout.tsx    # Root layout
│   │   │   └── page.tsx      # Landing page
│   │   ├── components/       # React components
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── topbar.tsx
│   │   │   └── ui/           # UI components (Radix UI)
│   │   ├── lib/              # Utility functions
│   │   │   ├── api.ts        # API client
│   │   │   ├── socket.ts     # WebSocket client
│   │   │   └── utils.ts      # Helper functions
│   │   └── providers.tsx      # React providers
│   ├── .env                  # Environment variables
│   ├── .env.example          # Environment variables template
│   ├── next.config.js        # Next.js configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── package.json          # Dependencies
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts       # Authentication middleware
│   │   │   └── errorHandler.ts
│   │   ├── routes/           # API routes
│   │   │   ├── analytics.ts  # Analytics endpoints
│   │   │   ├── auth.ts       # Authentication endpoints
│   │   │   ├── campaigns.ts  # Campaign endpoints
│   │   │   ├── customers.ts  # Customer endpoints
│   │   │   ├── messages.ts   # Message endpoints
│   │   │   ├── settings.ts   # Settings endpoints
│   │   │   ├── tags.ts       # Tag endpoints
│   │   │   ├── templates.ts  # Template endpoints
│   │   │   └── webhooks.ts   # Webhook endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── database.ts   # Prisma client
│   │   │   ├── encryption.ts # Encryption service
│   │   │   ├── socket.ts     # Socket.io service
│   │   │   └── whatsapp.ts   # WhatsApp API service
│   │   ├── validation/       # Input validation schemas
│   │   │   ├── auth.ts
│   │   │   └── common.ts
│   │   └── server.ts         # Express server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Prisma schema
│   ├── .env                  # Environment variables
│   ├── .env.example          # Environment variables template
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Dependencies
│
├── docker/                   # Docker configuration
├── docker-compose.yml        # Docker Compose configuration
├── package.json              # Root package.json
└── README.md                 # This file
```

## 🚦 Quick Start

### Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reachly
   ```

2. **Start PostgreSQL with Docker**
   ```bash
   docker-compose up -d
   ```
   This will start PostgreSQL on port 5432.

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   
   The following environment files are already configured:
   - `frontend/.env` - Frontend environment variables
   - `backend/.env` - Backend environment variables
   
   For production, update these files with your actual values:
   
   **Backend (.env)**:
   ```env
   DATABASE_URL="postgresql://reachly:reachly_password_123@localhost:5432/reachly_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   ENCRYPTION_KEY="your-32-character-encryption-key-here"
   WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token-here"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```
   
   **Frontend (.env)**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_WS_URL=http://localhost:5000
   NEXT_PUBLIC_APP_NAME=Reachly
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   cd ..
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Database: localhost:5432

### Verify Setup

1. Open http://localhost:3000 in your browser
2. You should see the Reachly landing page
3. Navigate to http://localhost:5000/health to verify the backend is running

## 📚 Available Scripts

### Root Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run build` - Build both frontend and backend
- `npm run install:all` - Install all dependencies

### Backend Scripts
- `npm run dev` - Start backend in development mode
- `npm run build` - Build backend for production
- `npm run start` - Start backend in production
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend Scripts
- `npm run dev` - Start frontend in development mode
- `npm run build` - Build frontend for production
- `npm run start` - Start frontend in production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🗄 Database Schema

### Tables

**Users**
- User authentication and profile management
- Relationships with all user-specific data

**Customers**
- Customer contact information and profiles
- Tag associations and message history

**Tags**
- Customer segmentation tags
- Color-coded organization

**Templates**
- Message templates with variable support
- WhatsApp API synchronization

**Campaigns**
- Bulk messaging campaigns
- Status tracking and analytics

**Messages**
- Individual message records
- Delivery status tracking

**Conversations**
- Chat conversation threads
- Real-time message synchronization

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Customers
- `GET /customers` - Get all customers (paginated)
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Tags
- `GET /tags` - Get all tags
- `POST /tags` - Create new tag
- `PUT /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag
- `GET /tags/:id/customers` - Get customers by tag

### Templates
- `GET /templates` - Get all templates
- `GET /templates/:id` - Get template by ID
- `POST /templates` - Create template
- `PUT /templates/:id` - Update template
- `DELETE /templates/:id` - Delete template
- `POST /templates/:id/sync` - Sync with WhatsApp API
- `POST /templates/:id/preview` - Preview template with variables

### Campaigns
- `GET /campaigns` - Get all campaigns
- `GET /campaigns/:id` - Get campaign by ID
- `POST /campaigns` - Create campaign
- `POST /campaigns/:id/send` - Send campaign
- `PUT /campaigns/:id/cancel` - Cancel campaign
- `GET /campaigns/:id/analytics` - Get campaign analytics

### Messages
- `GET /messages/conversations` - Get all conversations
- `GET /messages/conversations/:id/messages` - Get conversation messages
- `POST /messages/send` - Send message
- `PUT /messages/:id/read` - Mark message as read
- `GET /messages/unread-count` - Get unread message count

### Settings
- `GET /settings/whatsapp` - Get WhatsApp credentials
- `POST /settings/whatsapp` - Update WhatsApp credentials
- `DELETE /settings/whatsapp` - Delete WhatsApp credentials
- `POST /settings/whatsapp/test` - Test WhatsApp connection
- `GET /settings/profile` - Get user profile with stats
- `PUT /settings/profile` - Update user profile
- `PUT /settings/password` - Change password

### Analytics
- `GET /analytics/overview` - Get dashboard overview
- `GET /analytics/messages` - Get message analytics
- `GET /analytics/campaigns` - Get campaign analytics
- `GET /analytics/customers` - Get customer analytics
- `GET /analytics/templates` - Get template analytics
- `GET /analytics/conversations` - Get conversation analytics

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Data Encryption** - Encrypted WhatsApp credentials
- **Rate Limiting** - API rate limiting to prevent abuse
- **CORS Protection** - Configured CORS policies
- **Helmet.js** - Security headers for Express
- **Input Validation** - Zod schema validation

## 🎨 UI Components

The project uses Radix UI primitives styled with Tailwind CSS:

- Button
- Card
- Input
- Label
- Badge
- Avatar
- Select
- Table
- Tabs
- Progress
- ScrollArea
- Switch
- Textarea
- Separator

## 📡 Real-time Features

Socket.io is used for real-time communication:

- New message notifications
- Message status updates
- Conversation updates
- Campaign progress updates
- Typing indicators

## 🧪 Testing

To run tests (when implemented):

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐛 Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Verify Docker is running: `docker ps`
2. Check PostgreSQL logs: `docker logs reachly-postgres`
3. Verify DATABASE_URL in backend/.env

### Port Already in Use

If ports 3000 or 5000 are already in use:

1. Find the process using the port:
   ```bash
   lsof -i :3000  # or 5000
   ```

2. Kill the process or change the port in .env files

### Prisma Issues

If you encounter Prisma errors:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### Build Errors

If you encounter TypeScript or build errors:

```bash
# Clean and reinstall
rm -rf node_modules
rm -rf .next
rm -rf dist
npm install
npm run build
```

## 📝 Development Notes

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Conventional commits for git messages

### Environment Variables

Never commit `.env` files. Use `.env.example` as a template for required variables.

### Database Migrations

Always create migrations for schema changes:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
```

### API Documentation

API endpoints are self-documenting through TypeScript types. Refer to the type definitions in the validation folder.

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

### Environment Setup

Update `.env` files with production values:

- Use strong JWT_SECRET and ENCRYPTION_KEY
- Set NODE_ENV=production
- Update DATABASE_URL with production database
- Configure proper CORS origins
- Set up SSL/HTTPS

### Running in Production

```bash
# Backend
cd backend
npm run start

# Frontend
cd frontend
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with clear messages
5. Push to your branch
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues, questions, or contributions, please open an issue on GitHub.

## 🌟 Features Coming Soon

- [ ] Multi-language support
- [ ] Advanced analytics with export
- [ ] A/B testing for campaigns
- [ ] Integration with other platforms (CRM, Email)
- [ ] Mobile app
- [ ] Advanced automation workflows
- [ ] WhatsApp Business Account management
- [ ] Media file management
- [ ] Team collaboration features

---

Built with ❤️ using Next.js, Express, and PostgreSQL
