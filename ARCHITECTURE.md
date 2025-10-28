# Architecture Overview

## AP2_01 - MongoDB-React-Node.js Application

This document provides a high-level overview of the AP2_01 architecture, design decisions, and key components.

## Stack Overview

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **API**: RESTful endpoints with JSON responses
- **Authentication**: JWT-based authentication

### Frontend (React)
- **Framework**: React 18+ with functional components
- **State Management**: Context API / Redux (TBD)
- **Styling**: Tailwind CSS for utility-first styling
- **Build Tool**: Vite for fast development

### Development Tools
- **TypeScript**: Type safety across the stack
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions (see `.github/workflows/ci.yml`)
- **Linting**: ESLint + Prettier

## Project Structure

```
AP2_01/
├── client/          # React frontend
├── server/          # Express backend
├── docs/            # Documentation
│   ├── adr/        # Architecture Decision Records
│   └── ai/         # AI agent documentation
├── .github/         # GitHub workflows and templates
└── tests/           # Test suites
```

## Key Architectural Decisions

For detailed architectural decisions, see:
- [ADR Directory](/docs/adr/) - All architecture decision records
- [Foundation ADRs](https://github.com/IOUser755/foundation/tree/main/docs/adr) - Organizational standards

## Design Principles

1. **Separation of Concerns**: Clear boundaries between frontend, backend, and data layers
2. **Scalability**: Modular design supporting horizontal scaling
3. **Type Safety**: TypeScript throughout for reliability
4. **Test Coverage**: Comprehensive unit and integration tests
5. **Documentation First**: All decisions recorded in ADRs

# System Architecture - AP2_01 MERN SaaS Platform

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [Scalability & Performance](#scalability--performance)
- [Deployment Architecture](#deployment-architecture)
- [Integration Architecture](#integration-architecture)

---

## 🎯 Overview

AP2_01 is a production-ready, multi-tenant SaaS platform built on the MERN stack (MongoDB, Express, React, Node.js). The platform enables visual creation and execution of AI agents with mandate-based transaction processing and integrated payment orchestration.

### Core Principles

1. **Multi-Tenancy First**: Complete tenant isolation at all layers
2. **Type Safety**: TypeScript throughout for reliability
3. **Scalability**: Horizontal scaling capability built-in
4. **Security**: Defense-in-depth security model
5. **Observability**: Comprehensive logging and monitoring
6. **Extensibility**: Plugin architecture for integrations

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Vite                            │   │
│  │  • Agent Builder UI (Workflow Canvas)                    │   │
│  │  • Dashboard & Analytics                                 │   │
│  │  • Template Marketplace                                  │   │
│  │  • Transaction Monitoring                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌──────────────────────────────────────────────────────────────────┐
│                         API GATEWAY TIER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                                 │   │
│  │  • RESTful API Endpoints                                 │   │
│  │  • WebSocket Server (Socket.io)                          │   │
│  │  • Authentication & Authorization (JWT)                  │   │
│  │  • Rate Limiting (Redis)                                 │   │
│  │  • Request Validation                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC TIER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Core Services (Node.js)                                 │   │
│  │  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ Agent          │  │ Mandate        │                 │   │
│  │  │ Orchestrator   │  │ Generator      │                 │   │
│  │  └────────────────┘  └────────────────┘                 │   │
│  │  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ Payment        │  │ Transaction    │                 │   │
│  │  │ Processor      │  │ Manager        │                 │   │
│  │  └────────────────┘  └────────────────┘                 │   │
│  │  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ Tool           │  │ Workflow       │                 │   │
│  │  │ Registry       │  │ Engine         │                 │   │
│  │  └────────────────┘  └────────────────┘                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                         DATA TIER                                 │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  MongoDB         │  │  Redis           │                     │
│  │  • Tenants       │  │  • Sessions      │                     │
│  │  • Users         │  │  • Cache         │                     │
│  │  • Agents        │  │  • Rate Limits   │                     │
│  │  • Transactions  │  │  • Pub/Sub       │                     │
│  │  • Mandates      │  └──────────────────┘                     │
│  │  • Audit Logs    │                                            │
│  └──────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐     │
│  │  Stripe   │ │ Coinbase  │ │ Python    │ │ Google      │     │
│  │  Payment  │ │ Commerce  │ │ ADK       │ │ Cloud KMS   │     │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend Stack

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **React 18** | UI Framework | Component-based, large ecosystem, excellent performance |
| **TypeScript** | Type Safety | Catch errors early, better IDE support, self-documenting |
| **Vite** | Build Tool | Fast dev server, optimized builds, modern features |
| **React Router** | Routing | Standard for React SPAs, code splitting support |
| **TanStack Query** | Data Fetching | Caching, automatic refetching, optimistic updates |
| **Tailwind CSS** | Styling | Utility-first, rapid development, consistent design |
| **Socket.io Client** | Real-time | WebSocket abstraction, automatic reconnection |
| **React Hook Form** | Forms | Performance, validation, minimal re-renders |
| **Zod** | Validation | Type-safe schema validation, runtime type checking |

### Backend Stack

| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Node.js 18** | Runtime | JavaScript everywhere, async I/O, NPM ecosystem |
| **Express.js** | Web Framework | Minimal, flexible, extensive middleware ecosystem |
| **TypeScript** | Type Safety | Shared types with frontend, enhanced maintainability |
| **MongoDB** | Database | Document model fits agent configs, horizontal scaling |
| **Mongoose** | ODM | Schema validation, middleware, query building |
| **Redis** | Cache/Sessions | In-memory speed, pub/sub, distributed locks |
| **Socket.io** | WebSocket | Bidirectional communication, rooms, authentication |
| **JWT** | Authentication | Stateless, scalable, standard |
| **Winston** | Logging | Structured logging, multiple transports |

---

## 📊 Architecture Layers

### 1. Presentation Layer (Client)

**Responsibilities:**
- Render user interface
- Handle user interactions
- Manage client-side state
- Real-time updates via WebSocket
- Form validation
- Route navigation

**Key Components:**

```typescript
// Component Structure
components/
├── common/          // Reusable UI components
│   ├── Button
│   ├── Modal
│   ├── Input
│   └── Card
├── layout/          // Layout components
│   ├── Navbar
│   ├── Sidebar
│   └── DashboardLayout
├── agent/           // Agent-specific
│   ├── AgentCard
│   ├── AgentList
│   └── AgentBuilder/
└── transaction/     // Transaction-specific
```

**State Management:**

1. **Global State** (React Context)
   - Authentication state
   - Theme preferences
   - User settings

2. **Server State** (TanStack Query)
   - API data caching
   - Automatic refetching
   - Optimistic updates

3. **Local State** (useState/useReducer)
   - Form state
   - UI toggles
   - Temporary data

### 2. API Layer (Express Server)

**Responsibilities:**
- Route requests to controllers
- Authenticate and authorize requests
- Validate input data
- Rate limiting
- Error handling
- WebSocket connections

**Middleware Stack:**

```typescript
Request Flow:
1. CORS & Security Headers (helmet)
2. Body Parsing (express.json)
3. Request Logging (winston)
4. Authentication (JWT verification)
5. Tenant Isolation (tenantId injection)
6. Rate Limiting (Redis-backed)
7. Input Validation (express-validator)
8. Route Handler
9. Error Handler (if error occurs)
10. Response
```

**API Versioning:**
- Base path: `/api/v1`
- Version in URL for clarity
- Backward compatibility maintained

### 3. Business Logic Layer (Services)

**Core Services:**

**A. AgentOrchestrator**
```typescript
// Responsibilities:
- Parse and validate agent workflows
- Execute workflow steps sequentially
- Manage execution state
- Handle errors and rollbacks
- Emit real-time events
- Track performance metrics

// Key Methods:
executeAgent(context)
executeStep(step, state)
resolveParameters(params, variables)
evaluateCondition(condition, variables)
rollbackExecution(steps)
```

**B. MandateGenerator**
```typescript
// Responsibilities:
- Generate cryptographic signatures
- Create mandate chains
- Validate mandates
- Handle mandate revocation
- Verify signature authenticity

// Key Methods:
generateMandate(transaction)
signMandate(mandate, privateKey)
verifyMandate(mandate, publicKey)
createMandateChain(parent, child)
revokeMandate(mandateId)
```

**C. PaymentProcessor**
```typescript
// Responsibilities:
- Abstract payment provider differences
- Process payments through adapters
- Handle refunds and settlements
- Manage transaction states
- Process webhooks

// Key Methods:
processPayment(transaction)
refundPayment(transactionId)
getAdapter(provider)
handleWebhook(provider, payload)
```

**D. ToolRegistry**
```typescript
// Responsibilities:
- Register available tools
- Validate tool parameters
- Execute tools in isolation
- Manage tool versions
- Handle tool errors

// Key Methods:
registerTool(tool)
getTool(toolType)
validateParameters(params)
executeTool(tool, params, context)
```

**E. WorkflowEngine**
```typescript
// Responsibilities:
- Parse workflow definitions
- Validate DAG structure
- Detect circular dependencies
- Manage variable scope
- Support conditional branching

// Key Methods:
parseWorkflow(definition)
validateWorkflow(workflow)
detectCycles(workflow)
resolveVariables(step, context)
```

### 4. Data Access Layer (Models)

**Database Collections:**

```typescript
// Core Models
Tenant {
  name, domain, subscription, settings
  relationships: hasMany(User, Agent, Transaction)
}

User {
  email, password, role, permissions
  relationships: belongsTo(Tenant)
}

Agent {
  name, type, configuration, status
  relationships: belongsTo(Tenant), belongsTo(User)
}

Transaction {
  type, amount, status, mandateChain
  relationships: belongsTo(Tenant), belongsTo(Agent)
}

Mandate {
  type, data, signature, status
  relationships: belongsTo(Transaction), belongsTo(Mandate)
}

AuditLog {
  action, resource, changes, metadata
  relationships: belongsTo(Tenant), belongsTo(User)
}
```

---

## 🗄️ Data Architecture

### MongoDB Schema Design

**Multi-Tenancy Pattern:**

Every document includes `tenantId` for isolation:

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,  // Partition key
  // ... other fields
}

// Compound indexes for tenant isolation
{ tenantId: 1, createdAt: -1 }
{ tenantId: 1, status: 1 }
```

**Agent Configuration Schema:**

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  type: Enum['PAYMENT', 'WORKFLOW', 'DATA_PROCESSOR', 'CUSTOM'],
  configuration: {
    workflow: [
      {
        id: String,
        name: String,
        toolType: String,
        parameters: Object,
        condition: String,
        outputVariable: String,
        errorHandling: Enum['STOP', 'CONTINUE', 'ROLLBACK']
      }
    ],
    tools: [String],
    variables: Object,
    triggers: Object
  },
  performance: {
    executionCount: Number,
    successRate: Number,
    avgDuration: Number
  }
}
```

**Transaction Schema:**

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  transactionId: String,  // Unique identifier
  type: Enum['PAYMENT', 'REFUND', 'TRANSFER', 'SETTLEMENT'],
  status: Enum['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  amount: Number,
  currency: String,
  paymentProvider: String,
  mandateChain: [ObjectId],  // References to Mandate documents
  timeline: [
    {
      status: String,
      timestamp: Date,
      metadata: Object
    }
  ]
}
```

### Redis Data Structures

**1. Session Storage:**
```redis
Key: session:{sessionId}
Type: Hash
TTL: 24 hours
Value: { userId, tenantId, permissions, ... }
```

**2. Rate Limiting:**
```redis
Key: ratelimit:{endpoint}:{userId}
Type: String
TTL: 15 minutes
Value: request_count
```

**3. Cache:**
```redis
Key: cache:agent:{agentId}
Type: JSON
TTL: 5 minutes
Value: { agent_data }
```

**4. Real-time Events:**
```redis
Channel: agent:execution:{agentId}
Type: Pub/Sub
Messages: { event, data, timestamp }
```

### Data Flow Patterns

**1. Read Operations:**
```
Client → API → [Cache Check] → Database → [Cache Store] → API → Client
```

**2. Write Operations:**
```
Client → API → Validation → Database → [Cache Invalidate] → Audit Log → API → Client
```

**3. Real-time Updates:**
```
Service Event → WebSocket Server → Connected Clients
```

---

## 🔒 Security Architecture

### Defense in Depth

**Layer 1: Network Security**
- HTTPS/TLS encryption
- Firewall rules
- DDoS protection
- API Gateway

**Layer 2: Application Security**
- Input validation
- Output encoding
- CSRF protection
- Security headers (Helmet.js)

**Layer 3: Authentication**
```typescript
// JWT Token Structure
{
  userId: string,
  tenantId: string,
  role: string,
  permissions: string[],
  iat: number,
  exp: number
}

// Token Lifecycle
1. User login → Generate access token (15 min) + refresh token (7 days)
2. Include access token in Authorization header
3. Verify token on each request
4. If expired, use refresh token to get new access token
5. Logout → Blacklist both tokens in Redis
```

**Layer 4: Authorization**
```typescript
// Role-Based Access Control (RBAC)
Roles: SUPER_ADMIN, TENANT_ADMIN, DEVELOPER, VIEWER

// Permission Hierarchy
SUPER_ADMIN > TENANT_ADMIN > DEVELOPER > VIEWER

// Resource-Level Authorization
- Check user's role
- Verify tenant ownership
- Validate specific permissions
- Enforce row-level security
```

**Layer 5: Data Security**

1. **Encryption at Rest**
   - MongoDB encryption
   - Encrypted fields for sensitive data (payment methods)
   - Key management via Google Cloud KMS

2. **Encryption in Transit**
   - TLS 1.3 for all connections
   - Certificate management
   - Perfect forward secrecy

3. **Sensitive Data Handling**
   ```typescript
   // Never log sensitive data
   logger.info('User logged in', {
     userId: user.id,  // ✅ OK
     // password: user.password,  // ❌ Never
     // email: user.email  // ⚠️ Be careful with PII
   });
   
   // Encrypt before storing
   const encryptedCard = encrypt(cardDetails, encryptionKey);
   await PaymentMethod.create({
     details: encryptedCard,
     last4: cardDetails.slice(-4)  // Store only last 4 digits in plain
   });
   ```

**Layer 6: Audit & Monitoring**
```typescript
// Every significant action is logged
await AuditLog.create({
  tenantId,
  userId,
  action: 'AGENT_EXECUTED',
  resource: 'Agent',
  resourceId: agentId,
  changes: { /* before/after */ },
  ipAddress,
  userAgent,
  timestamp: new Date()
});
```

### Security Best Practices Implemented

1. ✅ **Principle of Least Privilege**: Users/services have minimum required permissions
2. ✅ **Input Validation**: All inputs validated and sanitized
3. ✅ **Output Encoding**: Prevent XSS attacks
4. ✅ **Parameterized Queries**: Prevent injection attacks (Mongoose handles this)
5. ✅ **Rate Limiting**: Prevent brute force and DoS
6. ✅ **Error Handling**: No sensitive info in error messages
7. ✅ **Dependency Scanning**: Automated with Dependabot
8. ✅ **Security Headers**: Helmet.js configuration
9. ✅ **CORS Configuration**: Whitelist allowed origins
10. ✅ **Session Management**: Secure, HTTP-only cookies for refresh tokens

---

## ⚡ Scalability & Performance

### Horizontal Scaling

**Stateless API Servers:**
```
Load Balancer
     │
     ├── API Server 1
     ├── API Server 2
     ├── API Server 3
     └── API Server N
```

All session state in Redis, enabling:
- Add/remove servers dynamically
- Zero-downtime deployments
- Geographic distribution

**Database Scaling:**

1. **Read Replicas**
   ```
   Primary (Writes) ──┬── Replica 1 (Reads)
                      ├── Replica 2 (Reads)
                      └── Replica 3 (Reads)
   ```

2. **Sharding** (for large scale)
   ```
   Tenant-based sharding:
   Tenants A-M → Shard 1
   Tenants N-Z → Shard 2
   ```

**WebSocket Scaling:**

```
Client 1 ─┐
Client 2 ─┼─→ Socket Server 1 ─┐
Client 3 ─┘                      │
                                 ├──→ Redis Pub/Sub
Client 4 ─┐                      │
Client 5 ─┼─→ Socket Server 2 ─┘
Client 6 ─┘
```

### Performance Optimizations

**1. Caching Strategy:**

```typescript
// Multi-level caching
Level 1: Browser Cache (static assets)
Level 2: CDN Cache (API responses for public data)
Level 3: Redis Cache (frequently accessed data)
Level 4: MongoDB (persistent storage)

// Cache Invalidation
- Time-based: TTL on cache entries
- Event-based: Invalidate on writes
- Version-based: Cache keys include version
```

**2. Database Optimization:**

```javascript
// Indexes for common queries
db.agents.createIndex({ tenantId: 1, status: 1 });
db.transactions.createIndex({ tenantId: 1, createdAt: -1 });
db.users.createIndex({ email: 1, tenantId: 1 }, { unique: true });

// Compound indexes
db.auditLogs.createIndex({ 
  tenantId: 1, 
  resourceType: 1, 
  timestamp: -1 
});

// Projection to reduce data transfer
Agent.find({ tenantId })
  .select('name type status performance')
  .lean();  // Return plain JS objects, not Mongoose documents
```

**3. Query Optimization:**

```typescript
// Pagination
const agents = await Agent.find({ tenantId })
  .limit(limit)
  .skip((page - 1) * limit)
  .sort({ createdAt: -1 });

// Aggregation for analytics
const stats = await Transaction.aggregate([
  { $match: { tenantId: mongoose.Types.ObjectId(tenantId) } },
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    totalAmount: { $sum: '$amount' }
  }}
]);
```

**4. Frontend Optimization:**

```typescript
// Code splitting
const AgentBuilder = lazy(() => import('./pages/agents/AgentBuilder'));

// Memoization
const expensiveCalculation = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// Debouncing
const debouncedSearch = useDebounce(searchTerm, 500);

// Virtual scrolling for long lists
<VirtualList
  items={items}
  itemHeight={80}
  renderItem={(item) => <AgentCard agent={item} />}
/>
```

### Performance Monitoring

```typescript
// API Response Time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      duration,
      status: res.statusCode
    });
  });
  next();
});

// Database Query Monitoring
mongoose.set('debug', (collectionName, method, query, doc) => {
  logger.debug('Mongoose query', {
    collection: collectionName,
    method,
    query,
    duration: /* query execution time */
  });
});
```

---

## 🚀 Deployment Architecture

### Development Environment

```
Developer Machine
├── Client (Vite dev server) - localhost:3000
├── Server (Nodemon) - localhost:5000
├── MongoDB (Docker) - localhost:27017
└── Redis (Docker) - localhost:6379
```

### Production Environment

```
┌─────────────────────────────────────────────────┐
│                 Load Balancer                    │
│                (NGINX/ALB)                       │
└─────────────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐       ┌───▼───┐       ┌───▼───┐
│ Web 1 │       │ Web 2 │       │ Web 3 │
│(Static│       │(Static│       │(Static│
│ Files)│       │ Files)│       │ Files)│
└───────┘       └───────┘       └───────┘
    
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────┐      ┌───▼────┐      ┌───▼────┐
│ API 1  │      │ API 2  │      │ API 3  │
│(Node.js│      │(Node.js│      │(Node.js│
│Express)│      │Express)│      │Express)│
└────────┘      └────────┘      └────────┘
    │                │                │
    └────────────────┼────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼─────────┐  ┌──▼─────┐    ┌────▼────┐
│  MongoDB    │  │ Redis  │    │  S3     │
│  Cluster    │  │ Cluster│    │(Assets) │
│(Atlas/Self) │  │        │    │         │
└─────────────┘  └────────┘    └─────────┘
```

### Container Architecture (Docker)

```dockerfile
# Multi-stage builds for optimization

# Client
FROM node:18-alpine AS client-builder
WORKDIR /app
COPY client/ .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=client-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Server
FROM node:18-alpine AS server-builder
WORKDIR /app
COPY server/ .
RUN npm ci && npm run build

FROM node:18-alpine
COPY --from=server-builder /app/dist /app/dist
COPY --from=server-builder /app/node_modules /app/node_modules
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment (Optional)

```yaml
# Deployment manifest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ap2-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ap2-api
  template:
    metadata:
      labels:
        app: ap2-api
    spec:
      containers:
      - name: api
        image: ap2/server:latest
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 🔗 Integration Architecture

### Payment Provider Integration

```typescript
// Adapter Pattern for Multiple Providers

interface PaymentAdapter {
  charge(params): Promise<PaymentResult>;
  refund(params): Promise<RefundResult>;
  createCustomer(params): Promise<Customer>;
  attachPaymentMethod(params): Promise<void>;
}

class StripeAdapter implements PaymentAdapter {
  // Stripe-specific implementation
}

class CoinbaseAdapter implements PaymentAdapter {
  // Coinbase-specific implementation
}

class CryptoAdapter implements PaymentAdapter {
  // Direct blockchain implementation
}

// Usage
const processor = new PaymentProcessor();
processor.registerAdapter('stripe', new StripeAdapter());
processor.registerAdapter('coinbase', new CoinbaseAdapter());
processor.registerAdapter('crypto', new CryptoAdapter());

// Process payment through appropriate adapter
await processor.processPayment({
  provider: 'stripe',
  amount: 100,
  currency: 'USD'
});
```

### Python ADK Integration

```typescript
// Two integration approaches:

// 1. Child Process Execution
import { spawn } from 'child_process';

const executePythonAgent = (scriptPath, params) => {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, JSON.stringify(params)]);
    
    python.stdout.on('data', (data) => {
      resolve(JSON.parse(data.toString()));
    });
    
    python.stderr.on('data', (data) => {
      reject(new Error(data.toString()));
    });
  });
};

// 2. HTTP API Communication
import axios from 'axios';

const callPythonAPI = async (endpoint, params) => {
  const response = await axios.post(
    `${process.env.PYTHON_ADK_URL}${endpoint}`,
    params
  );
  return response.data;
};
```

### External Service Integration

```typescript
// Service Registry Pattern

class ServiceRegistry {
  private services: Map<string, ExternalService>;
  
  register(name: string, service: ExternalService) {
    this.services.set(name, service);
  }
  
  get(name: string): ExternalService {
    return this.services.get(name);
  }
}

// Usage
const registry = new ServiceRegistry();

registry.register('stripe', new StripeService({
  apiKey: process.env.STRIPE_SECRET_KEY
}));

registry.register('sendgrid', new SendGridService({
  apiKey: process.env.SENDGRID_API_KEY
}));

registry.register('gcp-kms', new GCPKMSService({
  projectId: process.env.GCP_PROJECT_ID,
  keyRing: process.env.GCP_KEY_RING
}));
```

---

## 📊 Monitoring & Observability

### Logging

```typescript
// Structured logging with Winston

logger.info('User action', {
  userId,
  tenantId,
  action: 'AGENT_EXECUTED',
  agentId,
  duration,
  success: true
});

// Log levels: error, warn, info, debug
// Different transports: Console, File, CloudWatch, etc.
```

### Metrics

```typescript
// Track key metrics

- Request count per endpoint
- Response time (p50, p95, p99)
- Error rate
- Active users
- Database query performance
- Cache hit/miss ratio
- WebSocket connections
```

### Alerting

```typescript
// Alert conditions

- Error rate > 5%
- Response time > 2s
- Database connection pool exhausted
- Redis unavailable
- Disk space > 80%
- Memory usage > 90%
```

---

## 🎯 Design Decisions & Trade-offs

### Why MERN Stack?

**✅ Pros:**
- JavaScript everywhere (frontend + backend)
- Large ecosystem and community
- Rapid development
- Good for real-time features
- Flexible data model (MongoDB)

**⚠️ Cons:**
- JavaScript's type system (mitigated with TypeScript)
- NoSQL limitations for complex queries
- Requires discipline for large codebases

### Why MongoDB over PostgreSQL?

**✅ Chosen MongoDB because:**
- Flexible schema fits agent configurations
- Horizontal scaling built-in
- JSON-native (perfect for nested documents)
- Good for multi-tenancy with tenant-based sharding

**⚠️ Trade-off:**
- Less powerful for complex joins
- Eventual consistency in some scenarios
- No foreign key constraints

### Why Redis?

**✅ Chosen Redis because:**
- In-memory speed for caching
- Pub/Sub for real-time features
- Distributed locks
- Rate limiting support
- Session storage

---

## 🔄 Future Enhancements

### Planned Improvements

1. **Event Sourcing**: Implement event sourcing for audit trail
2. **GraphQL API**: Add GraphQL alongside REST
3. **Microservices**: Split into microservices as platform grows
4. **Message Queue**: Add RabbitMQ/Kafka for async processing
5. **ML Pipeline**: Integrate machine learning for agent optimization
6. **Multi-Region**: Deploy across multiple regions
7. **Blockchain Integration**: Direct blockchain transaction support

---

## 📚 References

- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Redis Documentation](https://redis.io/documentation)

---

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Maintained By:** Platform Architecture Team
