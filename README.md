# Reachly - WhatsApp Business API CRM Platform

A full-stack WhatsApp Business API CRM platform that helps businesses manage customer communications, send bulk messages, and track campaign performance.

## 🚀 Features

- **WhatsApp Business API Integration** - Connect and manage your WhatsApp Business API credentials.
- **Customer Management** - Organize customers with tags, notes, and detailed profiles.
- **Bulk Messaging** - Send personalized messages to thousands of customers instantly.
- **Template Management** - Create and manage WhatsApp message templates with dynamic variables.
- **Campaign Analytics** - Track message delivery, engagement, and campaign performance in real-time.
- **Real-time Chat** - Shared inbox for managing conversations.
- **Dashboard Analytics** - Comprehensive analytics and reporting, featuring live metrics.

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Axios & React Query** - Data fetching and state management
- **Recharts** - Dynamic charts for analytics
- **Framer Motion** - Smooth UI transitions

### Backend
- **Node.js & Express** - Robust backend framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern Database ORM
- **PostgreSQL** - Relational database
- **JWT & bcryptjs** - Secure authentication and password hashing
- **Zod** - Schema validation

## 📁 Project Structure

```
reachly/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js App Router (Dashboard, Inbox, Analytics, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # API clients and utilities
│   │   └── ...
│   ├── .env.local            # Frontend environment variables
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── routes/           # API routes (Customers, Campaigns, Settings, etc.)
│   │   ├── services/         # Business logic (WhatsApp API, Database)
│   │   └── server.ts         # Express entry point
│   ├── prisma/               # Database schemas and migrations
│   ├── .env                  # Backend environment variables
│   └── package.json
│
├── docker-compose.yml        # PostgreSQL container setup
├── package.json              # Root package with concurrent dev scripts
└── README.md                 
```

## 🚦 Quick Start

### Prerequisites
- **Node.js 18+**
- **Docker & Docker Compose** (for running the local PostgreSQL database)
- **Git**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reachly
   ```

2. **Install Dependencies**
   Install the root dependencies (this will install concurrently to run both servers at once):
   ```bash
   npm install
   ```
   Then install dependencies for both the frontend and backend:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Start PostgreSQL with Docker**
   The project uses a Docker container for the database to avoid local conflicts.
   ```bash
   docker-compose up -d
   ```
   *Note: This starts PostgreSQL on port `5433` (as defined in docker-compose.yml).*

4. **Environment Variables**
   Ensure your `.env` files are correctly set up.
   
   **`backend/.env`**:
   ```env
   DATABASE_URL="postgresql://reachly:reachly_password_123@127.0.0.1:5433/reachly_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   ENCRYPTION_KEY="your-32-character-encryption-key-here"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```

   **`frontend/.env.local`** (or `.env`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_APP_NAME=Reachly
   ```

5. **Run Database Migrations**
   Generate the Prisma client and apply the schema to your Docker database:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

6. **Start the Development Servers**
   Run the root dev script to start both the frontend and backend simultaneously:
   ```bash
   npm run dev
   ```
   
   This will start:
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5000
   - **Database:** localhost:5433

### Verify Setup
Open http://localhost:3000 in your browser. You can create an account and access the dashboard!

## 🗄 Database Schema Overview

- **Users:** Authentication and profile management (with company name support).
- **Customers:** Contact profiles, segments, and notes.
- **Tags & Contact Types:** Grouping and segmenting customers.
- **Templates:** Reusable WhatsApp message structures with dynamic variables.
- **Campaigns & CampaignMessages:** Bulk messaging orchestration and delivery tracking.
- **Conversations & Messages:** Two-way real-time messaging histories.

## 🔐 Security

- **JWT Authentication:** Secure token-based access.
- **Password Hashing:** bcryptjs for secure credential storage.
- **Data Encryption:** Encrypted storage of sensitive WhatsApp credentials.
- **Input Validation:** Zod schema validation across all API endpoints.

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with clear messages
5. Push to your branch
6. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

---
Built with ❤️ using Next.js, Express, and PostgreSQL.
