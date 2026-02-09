# Quick Start Guide - Phase 3

This guide will help you get Reachly Phase 3 up and running in minutes.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd reachly

# Run the setup script
chmod +x setup-phase3.sh
./setup-phase3.sh
```

The setup script will:
- Start PostgreSQL and Redis using Docker
- Install all dependencies
- Run database migrations
- Create necessary directories
- Generate configuration files

## 2. Configure Environment

Edit `backend/.env` with your WhatsApp Business API credentials:

```bash
# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
# Add your WhatsApp credentials after connecting

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-here

# Encryption Key (32 characters)
ENCRYPTION_KEY=your-32-character-key-here
```

## 3. Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Reachly Backend running on port 5000
📊 Environment: development
✅ Redis connected
All services initialized successfully
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

## 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Prometheus Metrics**: http://localhost:5000/monitoring/metrics

## 5. Create Your First Account

1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details
4. Verify your email (if configured)
5. Log in to access the dashboard

## Phase 3 Features to Try

### 1. Enhanced Inbox
- Go to Inbox
- Create conversation notes
- Add labels to conversations
- Pin important conversations
- Watch typing indicators in real-time

### 2. Advanced Campaigns
- Create a campaign with schedule settings
- Set throttle rate (messages per minute)
- Configure business hours window
- Set retry attempts
- Monitor campaign logs in real-time

### 3. Analytics Dashboard
- View enhanced metrics
- Check window compliance
- Monitor response times
- Track campaign ROI

### 4. Audit Logs
- View all admin actions
- Filter by entity type
- Track campaign events
- Monitor system changes

### 5. System Monitoring
- Access Prometheus metrics
- View system health
- Monitor messages per hour
- Check performance metrics

## Testing Campaign System

### Create a Test Campaign

```bash
# 1. Create a customer
POST http://localhost:5000/customers
{
  "name": "Test Customer",
  "phone": "+1234567890",
  "email": "test@example.com"
}

# 2. Create a tag
POST http://localhost:5000/tags
{
  "name": "Test Tag",
  "color": "#3B82F6"
}

# 3. Assign tag to customer
POST http://localhost:5000/customers/{customerId}/tags/{tagId}

# 4. Create a template
POST http://localhost:5000/templates
{
  "name": "Welcome Message",
  "category": "marketing",
  "content": "Hello {{name}}, welcome to our service!"
}

# 5. Create a campaign with Phase 3 features
POST http://localhost:5000/campaigns
{
  "name": "Welcome Campaign",
  "templateId": "template_123",
  "tagIds": ["tag_123"],
  "schedule": {
    "timezone": "America/New_York",
    "throttleRate": 5,
    "retryAttempts": 3,
    "windowStart": "09:00",
    "windowEnd": "17:00"
  }
}

# 6. Send the campaign
POST http://localhost:5000/campaigns/{campaignId}/send

# 7. Monitor in real-time via WebSocket
socket.on('campaign_update', (data) => {
  console.log('Campaign progress:', data)
})

# 8. View campaign logs
GET http://localhost:5000/campaigns/{campaignId}/logs
```

## WebSocket Testing

Connect to WebSocket for real-time features:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join a conversation
socket.emit('join_conversation', 'conversation_123');

// Listen for typing indicators
socket.on('user_typing', (data) => {
  console.log(`User ${data.userId} is typing...`);
});

// Listen for new messages
socket.on('message_received', (message) => {
  console.log('New message:', message);
});

// Listen for campaign updates
socket.on('campaign_update', (data) => {
  console.log('Campaign update:', data);
});
```

## Monitoring & Metrics

### View Prometheus Metrics
```bash
curl http://localhost:5000/monitoring/metrics
```

### Check System Health
```bash
curl http://localhost:5000/monitoring/health
```

### View Dashboard Metrics
```bash
curl http://localhost:5000/monitoring/dashboard?period=7d \
  -H "Authorization: Bearer your-jwt-token"
```

### Messages Per Hour
```bash
curl http://localhost:5000/monitoring/messages-per-hour?hours=24 \
  -H "Authorization: Bearer your-jwt-token"
```

## Troubleshooting

### Services Not Starting

```bash
# Check Docker services
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs redis

# Restart services
docker-compose restart
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec -it reachly-postgres psql -U reachly -d reachly -c "SELECT 1"
```

### Redis Connection Error

```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it reachly-redis redis-cli ping
# Should return: PONG
```

### Backend Not Starting

```bash
# Check backend logs
cd backend
npm run dev

# Common issues:
# 1. Missing .env file → Copy from .env.example
# 2. Database not migrated → Run: npx prisma migrate dev
# 3. Redis not running → Run: docker-compose up -d
```

### Frontend Not Starting

```bash
# Check frontend logs
cd frontend
npm run dev

# Common issues:
# 1. Missing .env.local → Create with API_URL
# 2. Port 3000 in use → Change in package.json
```

## Development Tips

### View Logs

Backend logs are stored in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

```bash
# Tail logs
tail -f backend/logs/combined.log
```

### Database Management

```bash
# Open Prisma Studio
cd backend
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Redis Management

```bash
# Connect to Redis CLI
docker exec -it reachly-redis redis-cli

# View all keys
KEYS *

# Monitor commands
MONITOR

# Get cache value
GET messages:inbound:2024-01-15T10
```

### Queue Management

```bash
# View Bull queues in Redis
docker exec -it reachly-redis redis-cli

# List campaign queue jobs
KEYS bull:campaign-processing:*

# List message queue jobs
KEYS bull:message-sending:*
```

## Next Steps

1. **Connect WhatsApp Business API**
   - Get API credentials from Meta
   - Update backend/.env
   - Test connection in Settings

2. **Import Customers**
   - Use CSV import feature
   - Or use REST API

3. **Create Templates**
   - Design message templates
   - Submit for WhatsApp approval

4. **Run Your First Campaign**
   - Create a test campaign
   - Monitor progress
   - View analytics

5. **Set Up Monitoring**
   - Configure Prometheus
   - Set up Grafana dashboards
   - Configure alerts

## Additional Resources

- **Full Documentation**: See README.md
- **Phase 3 Features**: See PHASE3_IMPLEMENTATION.md
- **API Reference**: Use Postman collection (if available)
- **Video Tutorials**: [Link to videos]

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `backend/logs/`
3. Check Docker service status
4. Review database migrations
5. Open an issue on GitHub

## Production Deployment

For production deployment:
1. Use managed PostgreSQL (Supabase, Neon, RDS)
2. Use managed Redis (Redis Cloud, AWS ElastiCache)
3. Set secure environment variables
4. Enable HTTPS
5. Configure proper CORS
6. Set up monitoring and alerts
7. Enable backups
8. Use a CDN for frontend

See deployment documentation for detailed instructions.
