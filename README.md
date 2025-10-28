# AgentPay Hub

AgentPay Hub is a multi-tenant payments orchestration platform built on the MERN stack. Tenants share the same runtime but are fully isolated by a strict `tenantId` context enforced across the API, WebSocket, and data layers—no per-customer infrastructure is required.

## Highlights

- **Tenant isolation**: Authentication middleware enriches every request with tenant metadata and guards MongoDB queries automatically.
- **Transaction engine**: Rich transaction model with timeline events, refunds, cancellations, and analytics aggregation (`server/src/controllers/transactionController.ts`).
- **Real-time experience**: Socket.IO integration and React hooks (`client/src/hooks/useWebSocket.ts`) stream execution and transaction updates to the dashboard.
- **Analytics dashboard**: `/api/analytics/overview` powers trend charts and agent performance widgets (`client/src/components/analytics/AnalyticsDashboard.tsx`).
- **Security posture**: Helmet headers, rate limiting, KMS utilities, and mandate signature helpers live in `server/src/middleware/security.ts` and `server/src/utils/crypto.ts`.
- **Test scaffolding**: Jest/Vitest suites plus Playwright E2E scenarios prepared under `server/src/tests` and `client/src/tests`.

## Architecture at a Glance

The detailed system breakdown—covering client modules, backend services, and data flows—is documented in [ARCHITECTURE.md](ARCHITECTURE.md). Key layers include:

1. **Client (React + Vite)** – workflow builder, dashboards, and real-time monitors.
2. **API Gateway (Express + Socket.IO)** – authentication, rate limiting, WebSocket fan-out.
3. **Business Services** – agent orchestration, mandate handling, transaction processing.
4. **Data Stores** – MongoDB for system of record, Redis for caching and rate-limit counters.

## Repository Layout

```
client/            React application (hooks, components, pages)
server/            Express API, services, and middleware
server/src/tests/  Jest suites for controllers and services
client/src/tests/  Vitest and Playwright specs
docker/            Production Dockerfiles and nginx config
.github/workflows/ CI/CD pipelines (build + release)
docs/              API and operational documentation
```

## Getting Started

### Prerequisites

- Node.js 22 LTS and npm 10+
- MongoDB 6.x and Redis 7.x instances (local or remote)
- Stripe / Coinbase credentials if you plan to exercise payment providers

### Quick Start

```bash
# Install workspace dependencies
npm install

# Copy environment templates
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start the development servers (client + API + Socket.IO)
npm run dev
```

Visit <http://localhost:3000> for the dashboard and <http://localhost:5000/api/health> for the API health endpoint. Seed tenants/users directly in MongoDB and generate JWTs with `{ userId, tenantId }` until the auth controller is implemented.

### Useful Scripts

| Command | Description |
|---------|-------------|
| `npm run lint --workspaces` | Run ESLint across client and server (requires local configuration). |
| `npm run test --prefix server` | Execute Jest unit and integration tests. |
| `npm run test --prefix client` | Run Vitest component tests. |
| `npx playwright test --config client/playwright.config.ts` | Launch end-to-end browser checks. |

## Deployment

A production-ready Docker Compose stack is provided at [`docker-compose.prod.yml`](docker-compose.prod.yml). The guide in [`docs/guides/DEPLOYMENT.md`](docs/guides/DEPLOYMENT.md) covers environment variables, image builds, health checks, and how the shared tenant-aware model eliminates the need for per-tenant infrastructure.

CI/CD pipelines live in [`.github/workflows`](.github/workflows). The `deploy-production.yml` workflow builds and pushes server/client images to GitHub Container Registry and can be extended to trigger your deployment target.

## Documentation

- [API Specification](docs/api/API_SPECIFICATION.md) – endpoint catalogue, error formats, and tenant scoping rules.
- [Deployment Guide](docs/guides/DEPLOYMENT.md) – end-to-end run book for Docker-based production.
- [Architecture](ARCHITECTURE.md) – in-depth component and system design reference.
- [Contributing](CONTRIBUTING.md) – coding standards and pull-request process.

## Testing & Quality

- Backend: Jest with an in-memory MongoDB test harness (`server/src/tests/setup.ts`).
- Frontend: Vitest + React Testing Library plus Playwright for browser flows (`client/src/tests`).
- Static analysis: ESLint and TypeScript configs shipped for both packages.

Run both suites locally before committing changes:

```bash
npm run test --prefix server
npm run test --prefix client
```

## License

[MIT](LICENSE)
