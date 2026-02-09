# Phase 3 Implementation - Real-time Messaging, Broadcast System, Analytics & Monitoring

## Overview

Phase 3 adds enterprise-grade features including real-time messaging, advanced broadcast campaigns, comprehensive analytics, and monitoring capabilities.

## Features Implemented

### 1. Enhanced Inbox System (WebSocket)

#### Real-time Features
- ✅ Real-time chat with WebSocket connections
- ✅ Multi-agent support with user rooms
- ✅ Typing indicators with automatic cleanup
- ✅ Read receipts tracking
- ✅ Media preview support
- ✅ Message search functionality
- ✅ Conversation notes
- ✅ Label management
- ✅ Pin/unpin conversations

#### Endpoints
```
GET    /inbox/conversations/:id/notes
POST   /inbox/conversations/:id/notes
PUT    /inbox/notes/:id
DELETE /inbox/notes/:id

GET    /inbox/labels
POST   /inbox/labels
PUT    /inbox/labels/:id
DELETE /inbox/labels/:id

POST   /inbox/conversations/:id/labels/:labelId
DELETE /inbox/conversations/:id/labels/:labelId

PUT    /inbox/conversations/:id/pin
```

#### WebSocket Events
```javascript
// Client → Server
socket.emit('join_conversation', conversationId)
socket.emit('leave_conversation', conversationId)
socket.emit('typing_start', { conversationId })
socket.emit('typing_stop', { conversationId })
socket.emit('mark_read', { messageId, conversationId })

// Server → Client
socket.on('message_received', message)
socket.on('user_typing', { userId, conversationId })
socket.on('user_stop_typing', { userId, conversationId })
socket.on('message_read', { messageId, userId })
socket.on('conversation_updated', { conversationId, ...updates })
```

### 2. Advanced Broadcast Campaign System

#### Workflow
```
Create → Configure Schedule → Select Segment → Preview → Send → Monitor
```

#### Features
- ✅ **Throttling**: Configurable messages per minute (default: 10/min)
- ✅ **Retry Logic**: Automatic retries with exponential backoff (3 attempts)
- ✅ **Timezone Support**: Schedule campaigns in user's timezone
- ✅ **Business Hours Window**: Only send during specified hours (e.g., 09:00-17:00)
- ✅ **Comprehensive Logs**: Track every campaign event
- ✅ **Failover**: Automatic failure handling and retry
- ✅ **Queue Management**: Bull queue for reliable message processing
- ✅ **Real-time Progress**: WebSocket updates during campaign execution

#### Campaign Configuration
```json
{
  "name": "Holiday Promotion",
  "templateId": "template_123",
  "tagIds": ["tag_1", "tag_2"],
  "scheduledAt": "2024-12-25T09:00:00Z",
  "schedule": {
    "timezone": "America/New_York",
    "throttleRate": 10,
    "retryAttempts": 3,
    "retryDelay": 60,
    "windowStart": "09:00",
    "windowEnd": "17:00"
  }
}
```

#### Endpoints
```
POST   /campaigns/:id/send       - Start campaign
PUT    /campaigns/:id/cancel     - Cancel running campaign
GET    /campaigns/:id/logs       - Get campaign execution logs
GET    /campaigns/:id/analytics  - Get campaign performance
```

### 3. Analytics Dashboard

#### Available Metrics

**Message Analytics**
- Messages per day/hour
- Delivery rate
- Open rate (read receipts)
- Failed message tracking
- Direction breakdown (inbound/outbound)

**Campaign Metrics**
- Campaign ROI
- Success rate
- Delivery rate per campaign
- Message throughput
- Window compliance rate

**Agent Performance**
- Average response time
- Messages handled per agent
- Active conversation count
- Response time distribution

**Customer Analytics**
- Customer growth over time
- Most active customers
- Customer segmentation by tags
- Conversation duration

#### Endpoints
```
GET /analytics/overview              - Dashboard overview
GET /analytics/messages              - Message analytics
GET /analytics/campaigns             - Campaign performance
GET /analytics/customers             - Customer insights
GET /analytics/templates             - Template usage stats
GET /analytics/conversations         - Response time analytics
GET /analytics/enhanced-metrics      - Comprehensive metrics
GET /analytics/window-compliance     - Business hours compliance
```

### 4. Audit Logs

#### Tracked Events
- Campaign created, sent, cancelled
- Customer deleted
- Settings updated
- Permission changes
- All admin actions

#### Log Structure
```json
{
  "id": "log_123",
  "userId": "user_123",
  "action": "campaign_sent",
  "entityType": "campaign",
  "entityId": "campaign_123",
  "oldValue": null,
  "newValue": { "status": "sending" },
  "metadata": { "totalMessages": 1000 },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Endpoints
```
GET /audit-logs?entityType=campaign&action=campaign_sent&startDate=2024-01-01
```

### 5. System Monitoring

#### Metrics Collected
- HTTP request duration (by endpoint)
- HTTP request count (by status code)
- Messages sent (by direction)
- Campaign throughput
- Active users (24h window)
- System health (CPU, memory, uptime)

#### Prometheus Integration
```
GET /monitoring/metrics              - Prometheus metrics
GET /monitoring/dashboard            - Dashboard metrics
GET /monitoring/messages-per-hour    - Message throughput
GET /monitoring/health               - System health check
```

#### Available Prometheus Metrics
```
http_request_duration_seconds{method,route,status_code}
http_requests_total{method,route,status_code}
messages_sent_total{direction,status}
campaigns_total{status}
```

## Architecture

### Infrastructure Components

#### Redis
- **Purpose**: Caching, pub/sub, queue management
- **Usage**: 
  - Socket.IO adapter for horizontal scaling
  - Bull queue backend
  - Real-time metrics storage

#### Bull Queue System
- **Campaign Queue**: Orchestrates campaign execution
- **Message Queue**: Processes individual message sends
- **Features**:
  - Rate limiting per campaign
  - Automatic retries with backoff
  - Job progress tracking
  - Failed job handling

#### WebSocket (Socket.IO)
- **Horizontal Scaling**: Redis adapter for multi-instance support
- **Rooms**: User rooms and conversation rooms
- **Events**: Typing, messages, read receipts, updates

### Database Schema Additions

```prisma
model ConversationNote {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  content        String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model ConversationLabel {
  id        String   @id @default(cuid())
  userId    String
  name      String
  color     String   @default("#8B5CF6")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CampaignSchedule {
  id            String  @id @default(cuid())
  campaignId    String  @unique
  timezone      String  @default("UTC")
  throttleRate  Int     @default(10)
  retryAttempts Int     @default(3)
  retryDelay    Int     @default(60)
  windowStart   String?
  windowEnd     String?
}

model CampaignLog {
  id         String   @id @default(cuid())
  campaignId String
  messageId  String?
  eventType  String
  eventData  Json?
  createdAt  DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  entityType String
  entityId   String?
  oldValue   Json?
  newValue   Json?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}

model SystemMetric {
  id         String   @id @default(cuid())
  metricType String
  value      Float
  metadata   Json?
  timestamp  DateTime @default(now())
}
```

## Services

### 1. Campaign Queue Service (`campaignQueue.ts`)
- Manages campaign execution
- Handles message queuing with throttling
- Implements retry logic
- Checks business hours windows
- Emits real-time updates

### 2. Audit Log Service (`auditLog.ts`)
- Centralized audit logging
- Helper methods for common actions
- Query interface for log retrieval

### 3. Metrics Service (`metrics.ts`)
- Records system metrics
- Aggregates analytics data
- Provides dashboard metrics
- Integrates with Redis for real-time data

### 4. Logger Service (`logger.ts`)
- Winston-based logging
- File and console transports
- Structured JSON logging
- Error tracking with stack traces

### 5. Redis Service (`redis.ts`)
- Redis connection management
- Pub/sub support
- Connection health monitoring

## Performance Optimizations

### 1. Horizontal Scaling
- Redis adapter enables multiple server instances
- Shared state across instances
- Load balancing support

### 2. Queue Management
- Throttled message sending prevents API rate limits
- Bulk job creation for efficiency
- Automatic job cleanup

### 3. Database Optimization
- Indexed fields for fast queries
- Efficient aggregation queries
- Pagination support

### 4. Caching Strategy
- Redis caching for frequently accessed data
- Message metrics cached hourly
- Reduces database load

## Monitoring & Observability

### Health Checks
```bash
# Basic health
GET /health

# Detailed system health
GET /monitoring/health

# Prometheus metrics
GET /monitoring/metrics
```

### Key Performance Indicators (KPIs)
1. **Message Delivery Rate**: Target > 95%
2. **Average Response Time**: Target < 5 minutes
3. **Campaign Success Rate**: Target > 90%
4. **Window Compliance**: Target 100%
5. **System Uptime**: Target 99.9%

### Alerting (Recommended Setup)
```yaml
# Prometheus Alert Rules
- alert: HighMessageFailureRate
  expr: rate(messages_sent_total{status="failed"}[5m]) > 0.1
  for: 5m
  
- alert: SlowResponseTime
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
  for: 5m

- alert: CampaignStuck
  expr: sum(campaigns_total{status="sending"}) > 0 for 1h
```

## Configuration

### Environment Variables
```bash
# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# Rate Limiting
DEFAULT_THROTTLE_RATE=10
DEFAULT_RETRY_ATTEMPTS=3
DEFAULT_RETRY_DELAY=60
```

## Testing Campaign System

### 1. Create Campaign with Schedule
```bash
POST /campaigns
{
  "name": "Test Campaign",
  "templateId": "template_123",
  "tagIds": ["tag_1"],
  "schedule": {
    "timezone": "UTC",
    "throttleRate": 5,
    "retryAttempts": 2,
    "windowStart": "09:00",
    "windowEnd": "17:00"
  }
}
```

### 2. Monitor Campaign
```bash
# Get campaign status
GET /campaigns/:id

# Get real-time logs
GET /campaigns/:id/logs

# WebSocket updates
socket.on('campaign_update', (data) => {
  console.log('Campaign progress:', data)
})
```

### 3. View Analytics
```bash
# Campaign performance
GET /analytics/campaigns?period=7d

# Window compliance
GET /analytics/window-compliance?period=30d
```

## Security Considerations

1. **Audit Logs**: All admin actions tracked with IP and user agent
2. **Rate Limiting**: Prevents abuse of campaign system
3. **Authentication**: All endpoints require valid JWT
4. **Data Validation**: Schema validation on all inputs
5. **Encryption**: Sensitive data encrypted at rest

## Future Enhancements

1. **AI-Powered Insights**: Predictive analytics for optimal send times
2. **A/B Testing**: Campaign template comparison
3. **Advanced Segmentation**: ML-based customer clustering
4. **Anomaly Detection**: Automatic detection of unusual patterns
5. **Multi-channel Support**: Email, SMS integration

## Deployment

### Prerequisites
```bash
# Redis
docker run -d -p 6379:6379 redis:alpine

# PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

### Migration
```bash
cd backend
npx prisma migrate dev --name phase3_features
npx prisma generate
```

### Installation
```bash
cd backend
npm install
npm run dev
```

## API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:5000/api-docs (if configured)
- Postman Collection: See `/docs/postman_collection.json`

## Support

For issues or questions about Phase 3 features:
1. Check logs in `backend/logs/`
2. Monitor Prometheus metrics at `/monitoring/metrics`
3. Review audit logs at `/audit-logs`
4. Check campaign logs at `/campaigns/:id/logs`
