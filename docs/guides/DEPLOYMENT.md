# Production Deployment Guide

This guide walks through deploying AgentPay Hub with the existing tenant-aware SaaS model. Tenant isolation is enforced in the application layer through the `tenantId` context—no extra Kubernetes clusters or Terraform provisioning is required to give customers dedicated environments.

## 1. Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- Access to a MongoDB 6.x instance (Atlas or self-hosted)
- Access to a Redis 7.x instance
- Stripe and Coinbase API credentials (optional for payment integrations)
- Node.js 18+ for running build or maintenance scripts

## 2. Environment Variables

Create two files alongside the codebase:

- `server/.env.production`
- `client/.env.production`

### Server

```
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/agentpay
REDIS_URL=redis://:password@redis-host:6379

# Security
JWT_SECRET=replace-with-generated-secret
JWT_REFRESH_SECRET=replace-with-refresh-secret
GCP_PROJECT_ID=project-id
GCP_KMS_KEY_RING=agentpay-ring
GCP_KMS_CRYPTO_KEY=agentpay-key
GCP_KMS_LOCATION=global

# Payments
STRIPE_SECRET_KEY=sk_live_...
COINBASE_API_KEY=...
COINBASE_API_SECRET=...

# Email & Monitoring (optional)
SENDGRID_API_KEY=...
SENTRY_DSN=https://example.ingest.sentry.io/project
```

### Client

```
VITE_API_URL=https://api.agentpayhub.example
VITE_WS_URL=wss://api.agentpayhub.example
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 3. Build Images Locally

```
# From repository root
npm install

# Build production artifacts
npm run build --workspaces

# Build container images
docker build -t agentpay-server -f docker/Dockerfile.server .
docker build -t agentpay-client -f docker/Dockerfile.client .
```

The server image compiles TypeScript and embeds only production dependencies. The client image produces static assets served by nginx.

## 4. Run with Docker Compose

The repository ships with `docker-compose.prod.yml` configured for multi-container deployments. Update the environment variables referenced in the file or export them before running the stack.

```
export MONGO_ROOT_USERNAME=...
export MONGO_ROOT_PASSWORD=...
export MONGO_DB_NAME=agentpay
export REDIS_PASSWORD=...
export JWT_SECRET=...
export STRIPE_SECRET_KEY=...
export COINBASE_API_KEY=...
export COINBASE_API_SECRET=...
export GCP_PROJECT_ID=...
export GCP_KMS_KEY_RING=...
export GCP_KMS_CRYPTO_KEY=...
export GCP_KMS_LOCATION=global
export SENDGRID_API_KEY=...
export VITE_API_URL=https://api.agentpayhub.example
export VITE_WS_URL=wss://api.agentpayhub.example
export VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Launch stack
docker compose -f docker-compose.prod.yml up -d
```

Services included:

- **mongodb** – primary datastore; initialises with admin credentials.
- **redis** – used for caching, rate limiting, and background jobs.
- **server** – Express API and WebSocket gateway (per-tenant isolation enforced here).
- **client** – Static React build served by nginx.

Because tenancy is handled in the application, scaling requires only running additional server or client containers pointing to the same shared databases.

## 5. Health Checks

After the stack is running:

```
curl -f https://api.agentpayhub.example/health
curl -f https://app.agentpayhub.example/health
```

The API health response includes per-service status (MongoDB, Redis) so you can verify connectivity without direct database access.

## 6. Continuous Delivery with GitHub Actions

The workflow in `.github/workflows/deploy-production.yml` builds and pushes both images to GitHub Container Registry. To enable it:

1. Configure the following repository secrets:
   - `VITE_API_URL_PROD`
   - `VITE_WS_URL_PROD`
   - `VITE_STRIPE_PUBLISHABLE_KEY_PROD`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `COINBASE_API_KEY`
   - `COINBASE_API_SECRET`
   - `MONGO_ROOT_PASSWORD`
   - `REDIS_PASSWORD`
   - `SLACK_WEBHOOK`
   - `KUBE_CONFIG` (only if you later add a Kubernetes step)
2. Push to the `main` branch or publish a GitHub release.
3. The job builds the server and client images, tags them with the commit SHA, and pushes them to GHCR.

The deploy job is currently set up to patch Kubernetes manifests if provided with a kubeconfig. If you are running only Docker Compose, you can disable the `deploy-to-kubernetes` job by adding a conditional or removing the step—the tenant-aware design means a single shared cluster is optional.

## 7. Database & Tenant Seeding

1. Create an initial tenant and user directly in MongoDB using the schemas in `server/src/models`.
2. Generate JWTs containing `{ "userId": "...", "tenantId": "..." }` until the login endpoint is implemented.
3. Provide the token to the client application; it will scope all WebSocket and REST calls to the tenant automatically.

## 8. Scaling Considerations

- **Horizontal scaling**: Run more `server` containers behind a load balancer. Each instance honours tenant isolation via middleware.
- **Caching**: Enable Redis clustering if you expect high request volume or strict rate limits per tenant.
- **Observability**: The server logs structured JSON through Winston (`server/src/config/logger.ts`). Forward container logs to your preferred log aggregator.

## 9. Maintenance Tasks

- Rotate `JWT_SECRET` and KMS-managed keys regularly.
- Use the `/api/analytics/overview` endpoint to confirm tenant activity after deployments.
- Run the Jest and Vitest suites (`npm run test --prefix server`, `npm run test --prefix client`) before pushing to ensure regressions are caught.

## 10. Rollback Strategy

1. `docker compose -f docker-compose.prod.yml down` to stop the stack.
2. Re-run `docker compose ...` with previously known-good image tags.
3. Because data is centralised in MongoDB and Redis volumes, tenants retain their state during rollbacks.

---

With these steps you can run AgentPay Hub as a multi-tenant SaaS using only the shared infrastructure provided in this repository. Tenant onboarding simply creates new `tenantId` records—no additional infrastructure provisioning is necessary.
