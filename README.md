# URL Shortener (Portfolio Demo)

This is a URL shortener with redirect + click analytics, aimed at people who share links frequently (for example affiliates, creators, and marketers).

## Why this exists

- Show how to keep redirect latency fast while still collecting analytics.
- Show a path from simple MVP architecture to higher-scale architecture.
- Show practical trade-offs: what is implemented now vs what is intentionally deferred.
- Show consistent API design and clean separation between backend and UI.

## Design decisions (implemented and planned)

### Slug indexing

- **Implemented:** Unique slug at DB level and slug validation at API layer.
- **Why:** Fast slug lookup on redirect path and strong data integrity under concurrent writes.
- **Trade-off:** Strict slug rules reduce edge-case complexity but limit custom characters.

### Async click logging on redirect

- **Implemented:** Redirect returns immediately while click recording runs asynchronously.
- **Why:** Redirect path should optimize for user-perceived speed, not analytics write completion.
- **Trade-off:** A small number of clicks may be dropped if async logging fails.

### Redirect caching with Redis

- **Planned:** Add Redis cache in front of slug-to-destination lookup.
- **Why:** Reduce repeated database reads on hot links and keep redirect latency predictable.
- **Trade-off:** Cache invalidation strategy is required for updates/deletes.

### Click aggregation (partition + daily rollups)

- **Planned:** Partition click event tables and materialize daily aggregates.
- **Why:** Keep raw events for audit detail while making analytics queries cheaper at scale.
- **Trade-off:** Higher data pipeline complexity and eventual consistency in dashboards.

### CDN layer

- **Planned:** Put CDN/edge layer in front of redirect traffic.
- **Why:** Lower global latency and absorb traffic spikes before origin.
- **Trade-off:** More operational layers and cache/key invalidation considerations.

### REST API design

- **Implemented:** Resource-oriented routes with clear status codes and predictable payloads.
- **Why:** Easy integration for frontend now and external clients later.
- **Trade-off:** REST simplicity over richer query flexibility from alternatives.

### Frontend choice: Next.js app

- **Implemented:** Simple management UI for create/list/update/delete flows.
- **Why:** Quick iteration speed and straightforward app-structure for demo readability.
- **Trade-off:** UI stays intentionally lean; focus is backend/data-flow reasoning.

### Backend choice: Fastify

- **Implemented:** Fastify-based API and redirect service in one backend app.
- **Why:** Low overhead request handling and clean plugin-based composition.
- **Trade-off:** Single service is simpler now but will need decomposition as scope grows.

### Future service split

- **Planned:** Split redirect path from management domain (potentially NestJS for management domain).
- **Why:** Redirect path has different latency/SLA profile than admin/business features.
- **Trade-off:** More infra and cross-service coordination.

### Business-layer features

- **Planned:** Auth/users/ownership and richer management features.
- **Why:** Important for real product operation, but not required to demonstrate core architecture.
- **Trade-off:** Deferred to keep this demo focused on traffic/data pipeline concerns first.

### Nice-to-have delivery improvements

- **Planned:** Docker setup, seed script, Swagger docs, architecture diagram.
- **Why:** Improve onboarding, reproducibility, and communication quality.
- **Trade-off:** Secondary priority compared to core architectural baseline.

## Current status snapshot

### Implemented now

- Link CRUD API (`/links`)
- Public redirect endpoint (`/:slug`)
- Click event records and `click_count` increment
- Link management UI (create/list/edit/delete)
- Backend tests for route and service behavior

### Planned next

- Redis redirect caching
- Click aggregation pipeline
- CDN layer
- Swagger/OpenAPI documentation
- Docker and seed tooling
- Architecture diagram

## Tech stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Backend: Fastify, TypeScript
- Database: PostgreSQL
- ORM: Prisma

## Repository structure

```text
.
├── frontend/   # Next.js app for link management
└── backend/    # Fastify API + redirect service
```

## Prerequisites

- Node.js 20+ (recommended)
- npm
- PostgreSQL (local or hosted)

## Environment variables

Create these files manually.

### `backend/.env`

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
```

## Local setup

Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Prepare Prisma client and database schema:

```bash
cd backend
npx prisma generate
npx prisma db push
```

Run backend (port `3001`):

```bash
cd backend
npm run dev
```

Run frontend (port `3000`) in another terminal:

```bash
cd frontend
npm run dev
```

Open:

- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

## API overview

Management endpoints:

- `POST /links` - create short link
- `GET /links` - list links
- `GET /links/:slug` - get link detail
- `PATCH /links/:slug` - update destination URL
- `DELETE /links/:slug` - delete link

Public redirect endpoint:

- `GET /:slug` - 302 redirect to destination URL

### Example requests

Create a short link:

```bash
curl -X POST http://localhost:3001/links \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "promo-landing",
    "destination_url": "https://example.com/very/long/path"
  }'
```

Use the short link:

```bash
curl -i http://localhost:3001/promo-landing
```

## Testing and quality checks

Backend tests:

```bash
cd backend
npm test
```

Frontend lint:

```bash
cd frontend
npm run lint
```
