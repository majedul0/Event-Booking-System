# Event Booking System

A production-ready event booking platform featuring concurrent booking processing, guaranteed data integrity under load, and a real-time React dashboard.

## Overview

The Event Booking System is a full-stack application consisting of:
- **Backend**: NestJS API with PostgreSQL and Redis-based asynchronous queue
- **Frontend**: React dashboard for viewing and creating bookings
- **Queue**: BullMQ for reliable event processing with retry logic

Key features:
- Fast booking endpoint (202 Accepted) with asynchronous processing
- Guaranteed no-overbooking under concurrent requests
- Idempotent duplicate request handling (same `requestId` never creates multiple bookings)
- Paginated booking list with filtering by event and status
- Real-time dashboard with status polling

## Setup

### Prerequisites

- Node.js v24+
- Docker & Docker Compose
- Git

### Installation & Running

1. **Clone and install dependencies**
   ```bash
   cd Event\ Booking\ System
   npm install          # Install in project root (or skip if installing separately)
   cd backend && npm install && cd ..
   cd client && npm install && cd ..
   ```

2. **Start infrastructure (PostgreSQL + Redis)**
   ```bash
   docker compose up -d
   ```
   Verify containers are running:
   ```bash
   docker compose ps
   ```

3. **Setup database**
   ```bash
   cd backend
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev --name init
   
   # Seed sample events
   npx prisma db seed
   
   cd ..
   ```

4. **Start backend**
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend will run on http://localhost:3000

5. **Start frontend** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on http://localhost:5173

### Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/event_booking"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
```

**Frontend** (`client/.env.local`):
```
VITE_API_URL=http://localhost:3000
```

## Architecture

### Data Integrity: No Overbooking Guarantee

The single most critical aspect of this system is preventing overbooking when many bookings arrive simultaneously for the same event.

**The Problem**: If an event has 5 seats and 10 booking requests arrive concurrently, we must ensure exactly 5 are confirmed and 5 are failed—no more, no fewer.

**The Solution**: Atomic Conditional Update at the Database Level

The seat deduction happens via a single atomic `UPDATE` statement in the booking processor:

```sql
UPDATE "Event" 
SET "availableSeats" = "availableSeats" - #{seats}
WHERE id = #{eventId} 
  AND "availableSeats" >= #{seats}
```

**Why This Works**:
1. **Postgres takes a row lock** during the `UPDATE` evaluation and execution.
2. **Concurrent updates to the same row block** until the first one commits.
3. **Each concurrent `UPDATE` re-evaluates its `WHERE` clause** against the committed value, seeing the reduced seat count.
4. **If insufficient seats remain**, the `WHERE` clause filters out the row, and `affected_rows = 0`, so the booking fails.
5. **No explicit `SELECT ... FOR UPDATE` is needed**—the check is folded into the update itself, making the entire operation atomic.

This pattern is race-free under Postgres's default READ COMMITTED isolation level. Application-level checks (e.g., "read seats, then decide to update") would introduce a race window and are avoided here.

**Proof**: The integration test (`test/bookings-concurrency.e2e-spec.ts`) seeds a 5-seat event, fires 10 concurrent booking-processing jobs (1 seat each) against a real Postgres instance, and verifies exactly 5 confirmations, 5 failures, and 0 available seats remaining. This test must pass and proves the guarantee empirically.

### Idempotency: Duplicate Request Handling

Every booking request carries a client-generated `requestId` (UUID). If the same `requestId` is submitted twice, the system returns the original booking without creating a duplicate.

**Implementation**:
1. The `requestId` field has a unique database constraint.
2. On `POST /bookings`, the service attempts `prisma.booking.create(...)`.
3. If this throws a Prisma `P2002` error (unique violation on `requestId`), we catch it and fetch the existing booking by `requestId`.
4. Return its current status and reference—no new job is enqueued.

This create-then-catch pattern is race-safe because the database unique index is the arbiter of truth. A check-then-insert pattern in application code would lose to concurrent requests.

**Secondary Guards**:
- BullMQ `jobId` set to booking ID: duplicate `queue.add()` calls with the same `jobId` are no-ops.
- Processor idempotency check: if the booking status is not `PENDING`, the processor returns early and does nothing (guarding against at-least-once queue redelivery).

### Asynchronous Processing

The `POST /bookings` endpoint returns **202 Accepted** immediately with the booking reference and status. Processing happens asynchronously via BullMQ:

1. **Request arrives** → booking created with status `PENDING` → job enqueued → `202` response.
2. **Worker processes job** → validates event, checks/deducts seats, updates booking status → `CONFIRMED` or `FAILED`.
3. **Frontend polls** booking status for ~15 seconds; if still `PENDING`, user can manually refresh.

**Queue Configuration**:
- **Concurrency**: 5 workers process bookings in parallel (deliberately > 1 to prove overbooking prevention works under real concurrency, not just single-threaded queue luck).
- **Retries**: 3 attempts with exponential backoff for transient errors (e.g., DB connection blip).
- **No retry on business failures**: "Event not found" or "Sold out" are marked `FAILED` and resolved immediately (not retried).

**Critical BullMQ Configuration**:
```typescript
connection: {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,  // Must be null, else Worker throws
}
```

## API Endpoints

### POST /bookings
Create a new booking.
```json
{
  "requestId": "7f3c2a10-9b1e-4d5a-8c6f-booking-001",
  "eventId": 1,
  "customerName": "Rahim Uddin",
  "customerEmail": "rahim@example.com",
  "seats": 2
}
```
**Response**: `202 Accepted`
```json
{
  "reference": "f7a3c2c0-...",
  "status": "PENDING"
}
```

### GET /bookings
Retrieve bookings with pagination and filtering.
```
GET /bookings?page=1&limit=10&eventId=1&status=CONFIRMED
```
**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "f7a3c2c0-...",
      "requestId": "7f3c2a10-...",
      "eventId": 1,
      "event": { "name": "Tech Conference 2024" },
      "customerName": "Rahim Uddin",
      "customerEmail": "rahim@example.com",
      "seats": 2,
      "status": "CONFIRMED",
      "failureReason": null,
      "createdAt": "2024-08-10T10:30:00Z",
      "updatedAt": "2024-08-10T10:30:05Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### GET /events
List all events with seat availability.
```
GET /events
```
**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Tech Conference 2024",
    "date": "2024-09-15T00:00:00Z",
    "totalSeats": 100,
    "availableSeats": 95,
    "pricePerSeat": "99.99",
    "createdAt": "2024-08-10T10:00:00Z"
  }
]
```

## Testing

### Concurrency Test (Proves No Overbooking)
```bash
cd backend
npm run test:e2e
```
This test:
1. Seeds a 5-seat event.
2. Creates 10 concurrent bookings (1 seat each).
3. Processes all jobs concurrently.
4. Asserts exactly 5 `CONFIRMED`, 5 `FAILED`, and `availableSeats = 0`.

The test exercises the real Postgres instance from `docker-compose`.

### Manual Testing

1. **Start the system** (docker compose, backend, frontend).

2. **Test with Postman** (Recommended):
   - Method: `POST`
   - URL: `http://localhost:3000/bookings`
   - Body (JSON):
   ```json
   {
     "requestId": "7f3c2a10-9b1e-4d5a-8c6f-booking-001",
     "eventId": 1,
     "customerName": "Rahim Uddin",
     "customerEmail": "rahim@example.com",
     "seats": 2
   }
   ```
   - Expected Response: `202 Accepted`
   ```json
   {
     "reference": "2ec193a6-613b-43ae-831c-333f0089a143",
     "status": "CONFIRMED"
   }
   ```
   
   ![Postman Output](./postmanoutput.png)

3. **Create multiple bookings** concurrently via curl:
   ```bash
   # Terminal 1
   curl -X POST http://localhost:3000/bookings \
     -H 'Content-Type: application/json' \
     -d '{
       "requestId": "booking-user-1-'$(date +%s)'",
       "eventId": 1,
       "customerName": "Test User 1",
       "customerEmail": "user1@example.com",
       "seats": 2
     }'
   
   # Terminal 2, 3, 4, ... (repeat with different requestIds)
   ```

4. **Verify in dashboard**: Open http://localhost:5173, bookings appear with `PENDING` status, then transition to `CONFIRMED` or `FAILED` within seconds.

5. **Test idempotency**: Submit the same `requestId` twice; second request returns the original booking's reference (no duplicate created).

## Database Schema

### Event
| Column | Type | Notes |
|--------|------|-------|
| id | INT PRIMARY KEY | Auto-increment |
| name | STRING | Event name |
| date | DATETIME | Event date/time |
| totalSeats | INT | Total seats for event |
| availableSeats | INT | Remaining seats |
| pricePerSeat | DECIMAL(10,2) | Price per seat |
| createdAt | DATETIME | Timestamp |

### Booking
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PRIMARY KEY | Booking reference (public ID) |
| requestId | STRING UNIQUE | Client-provided idempotency key |
| eventId | INT FK | References Event |
| customerName | STRING | |
| customerEmail | EMAIL | |
| seats | INT | Number of seats booked |
| status | ENUM | PENDING, CONFIRMED, FAILED |
| failureReason | STRING NULL | Reason for failure (e.g., "Sold out") |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

## Deployment Considerations

**For production, consider**:
1. **Connection pooling**: Increase `connection_limit` in `DATABASE_URL` if scaling to many concurrent workers.
2. **Redis persistence**: Enable AOF or RDB snapshots for queue durability.
3. **Error monitoring**: Integrate Sentry or similar to track processor failures.
4. **Rate limiting**: Add API rate limiting to prevent abuse.
5. **Authentication**: Protect bookings list and creation endpoints (not in MVP scope).
6. **Scaling workers**: Run multiple backend instances with separate queue processors for high throughput.

## What Would Be Improved With More Time

1. **Authentication & Authorization**: Add JWT-based auth; bookings should be scoped to authenticated users.
2. **Webhook Notifications**: Notify customers via email when bookings are confirmed or failed.
3. **Payment Integration**: Stripe or PayPal integration for seat payment; hold payment until confirmation.
4. **Admin Dashboard**: Event management UI (create/edit events, view booking analytics).
5. **Transaction Rollback on Failure**: If payment fails after seat deduction, restore the seat in a compensating transaction.
6. **More Granular Logging**: Structured logging with request tracing IDs for debugging.
7. **API Documentation**: Swagger/OpenAPI spec for the backend.
8. **Enhanced Error Handling**: More specific error messages (e.g., "Event already started" vs. "Sold out").
9. **Caching**: Redis cache for frequently accessed events to reduce DB load.
10. **End-to-End Tests**: Comprehensive Playwright tests for the dashboard UI (filters, pagination, polling).
11. **Performance**: Optimize large booking list queries with indexes and pagination defaults.
12. **DLQ (Dead Letter Queue)**: Handle jobs that fail after max retries with manual intervention.

## Troubleshooting

**Backend won't start**:
- Ensure Docker containers are running: `docker compose ps`
- Check `.env` variables match docker-compose network.
- Verify port 3000 is available.

**Database migration fails**:
- Ensure Postgres is healthy: `docker compose logs postgres`
- Delete existing migrations in `backend/prisma/migrations` and re-run `npx prisma migrate dev --name init`.

**Bookings stuck in PENDING**:
- Check Redis is running: `redis-cli ping` (should return PONG).
- Check worker logs in terminal running `npm run start:dev` in backend.
- Verify `maxRetriesPerRequest: null` is in BullModule config.

**Frontend can't reach backend**:
- Ensure backend is running on port 3000.
- Check `VITE_API_URL` in `client/.env.local`.
- Allow CORS (already enabled in `app.enableCors()`).

## Project Structure

```
Event Booking System/
├── backend/
│   ├── src/
│   │   ├── main.ts                  # Entry point, ValidationPipe setup
│   │   ├── app.module.ts            # Root module, BullModule config
│   │   ├── prisma/                  # Global Prisma service/module
│   │   ├── events/                  # Events module (GET /events)
│   │   ├── bookings/                # Bookings module
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   ├── bookings.processor.ts
│   │   │   ├── dto/
│   │   │   └── bookings.constants.ts
│   ├── prisma/
│   │   ├── schema.prisma            # Prisma schema
│   │   ├── seed.ts                  # Seed script
│   │   └── migrations/
│   ├── test/
│   │   └── bookings-concurrency.e2e-spec.ts
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── api/                     # API client & types
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── components/              # React components
│   │   ├── App.tsx                  # Main dashboard
│   │   └── main.tsx
│   ├── .env.local
│   └── package.json
├── docker-compose.yml               # Postgres + Redis
└── README.md
```

## Key Design Decisions

1. **Prisma 6.x** (not v7): Avoids driver adapter & ESM-only overhead; auto-seeding still works.
2. **BullMQ concurrency > 1**: Proves overbooking prevention is DB-level, not queue-luck.
3. **No separate "reference" field**: UUID `id` doubles as the public reference.
4. **Plain fetch API**: Minimal client dependencies; react-query not needed for MVP scope.
5. **Polling over WebSocket**: Simpler to implement and deploy; sufficient for ~10s latency tolerance.
6. **Atomic conditional UPDATE**: Simplest, most reliable no-overbooking pattern vs. advisory locks or transactions.

---

**Developed for Wenexus screening assignment. Built clean, production-ready, and deeply thoughtful about data integrity under load.**
