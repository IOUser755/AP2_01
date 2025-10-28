# AgentPay Hub API Specification

The AgentPay Hub API exposes REST endpoints that let each tenant manage agents, mandates, and payment transactions inside a shared SaaS environment. Every request is scoped to the authenticated tenant so that no extra infrastructure provisioning is required to isolate customers.

- **Base URL**: `/api`
- **Media type**: `application/json`
- **Authentication**: JSON Web Token (JWT) supplied with `Authorization: Bearer <token>`

> **Note**
> Authentication endpoints exist but currently respond with `501 Not Implemented`. Seed tokens must be created manually until the auth controller is completed.

## Tenant & Authentication Context

Each authenticated request attaches both a `user` and a `tenant` object to the Express request. Server middleware automatically adds `tenantId` filters to database queries, enforces per-tenant rate limits, and records tenant metadata in audit logs. Client applications should therefore request resources only through authenticated calls—no tenant-specific infrastructure or subdomains are required.

## Rate Limiting

Rate limits are calculated per tenant and endpoint family. When a limit is exceeded the API returns `429 Too Many Requests` with a retry window.

```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

## Error Format

All errors follow a consistent envelope.

```json
{
  "error": {
    "message": "Start date must be before end date",
    "code": "INVALID_DATE_RANGE",
    "status": 400
  }
}
```

Additional diagnostic fields may be included for validation errors.

## Health

### `GET /api/health`
Returns an aggregate health snapshot and build metadata.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-04-17T10:23:12.456Z",
  "version": "1.0.0",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "disabled" }
  }
}
```

## Authentication

> Endpoints are present but return `501 Not Implemented`. They are documented here for completeness.

| Method | Path            | Description            |
|--------|-----------------|------------------------|
| POST   | `/api/auth/login`    | Exchange credentials for a JWT. |
| POST   | `/api/auth/register` | Register a tenant user.         |
| POST   | `/api/auth/refresh`  | Refresh an access token.        |

Until implemented, create JWTs using the same payload structure consumed by `auth` middleware: `{ userId, tenantId }`.

## Agents

Agent endpoints are stubbed while the builder UI is completed. They currently return `501 Not Implemented` responses.

| Method | Path           | Description                  |
|--------|----------------|------------------------------|
| GET    | `/api/agents`  | List agents for the tenant.  |
| POST   | `/api/agents`  | Create a new agent draft.    |

## Transactions

Transaction endpoints are fully implemented and scoped per tenant.

### `POST /api/transactions`
Create a payment transaction and enqueue it for processing.

**Request body**
```json
{
  "agentId": "65a12f...",
  "amount": 125.5,
  "currency": "USD",
  "paymentProvider": "STRIPE",
  "paymentMethodId": "pm_123",
  "description": "Subscription renewal",
  "metadata": {
    "reference": "INV-2049"
  }
}
```

**Response**
```json
{
  "transaction": {
    "id": "txn_65f...",
    "status": "PENDING",
    "amount": { "value": 125.5, "currency": "USD", "precision": 2 },
    "tenantId": "tenant_123",
    "timeline": [
      {
        "status": "PENDING",
        "message": "Transaction created"
      }
    ]
  }
}
```

Validation failures respond with `400` and include the offending field.

### `GET /api/transactions`
Retrieve paginated transactions for the tenant. Supports optional filters such as `status`, `agentId`, `startDate`, `endDate`, `minAmount`, and `maxAmount`.

**Response**
```json
{
  "transactions": [
    {
      "id": "txn_65f...",
      "status": "PENDING",
      "amount": { "value": 125.5, "currency": "USD", "precision": 2 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### `GET /api/transactions/:id`
Returns a single transaction with mandate chain, parties, and timeline metadata. Responds with `404` if the record is outside the tenant scope.

### `PATCH /api/transactions/:id`
Update transaction status or metadata. Only allows safe status transitions validated server-side.

### `POST /api/transactions/:id/cancel`
Marks an in-flight transaction as cancelled.

### `POST /api/transactions/:id/refund`
Issues a refund (full or partial). Supply optional `amount` and `reason` fields.

### `GET /api/transactions/analytics`
Aggregates transaction totals for dashboards. Accepts the same filter parameters as the list endpoint.

### `GET /api/transactions/export`
Streams CSV/JSON exports. Protected by stricter rate limits to prevent abuse.

## Analytics

### `GET /api/analytics/overview`
Returns dashboard metrics, trends, and top-performing agents for the requested period.

Query parameters:
- `startDate`, `endDate`: ISO 8601 range. Defaults to the last 30 days.
- `agentIds`: Comma-separated agent IDs to scope the report.
- `statuses`, `currencies`: Comma-separated filters.
- `reportType`: Optional custom report identifier (e.g., `COMPLIANCE`).

**Response**
```json
{
  "data": {
    "dashboardMetrics": {
      "totalTransactions": 12,
      "totalVolume": 5400,
      "averageTransactionValue": 450,
      "successRate": 83.33,
      "activeAgents": 3,
      "revenue": 156.6,
      "growth": {
        "transactions": 12.5,
        "volume": -3.2,
        "revenue": 7.8
      }
    },
    "transactionTrends": {
      "daily": [ { "date": "2024-04-01", "count": 2, "volume": 900 } ],
      "hourly": [ { "hour": 14, "count": 1, "volume": 450 } ],
      "currency": [ { "currency": "USD", "count": 10, "volume": 4800 } ],
      "status": [ { "status": "COMPLETED", "count": 8, "percentage": 66.7 } ]
    },
    "agentPerformance": [
      {
        "agentId": "65a12f...",
        "agentName": "Recurring Billing",
        "executionCount": 6,
        "successRate": 83.33,
        "averageDuration": 2800,
        "revenue": 4200,
        "lastExecution": "2024-04-15T09:21:00.000Z"
      }
    ],
    "period": {
      "start": "2024-03-16T00:00:00.000Z",
      "end": "2024-04-15T23:59:59.999Z"
    }
  }
}
```

Supplying `reportType` returns a domain-specific report payload instead of the overview bundle.

## Mandates, Templates, Integrations, and Webhooks

Routes are present and secured behind tenant middleware. Implementation is in progress and currently returns placeholder responses. Refer to the route files for current behaviour before consuming them in production.

## WebSocket Support

The REST server can run alongside Socket.IO (controlled via configuration). WebSocket connections share the same tenant guard: clients emit an authentication event that attaches the tenant context to the socket and join tenant-specific rooms for streaming updates.

## Versioning

All endpoints live under `/api`. Any breaking change will increment the top-level version field returned by the health endpoint and will be documented in this specification.
