# Server

This directory holds the Node.js + Express + TypeScript API server.

## Tech Stack
- Node 20 + TypeScript
- Express for HTTP API
- ts-node-dev or Nodemon + ts-node for dev
- Jest or Vitest for tests
- ESLint + Prettier (recommended)

## Scripts (to be added when scaffolding)
- dev: Start server with auto-reload (ts-node-dev)
- build: tsc compile to dist/
- start: node dist/index.js
- test: run test suite

## Suggested Structure
- src/
  - index.ts (app bootstrap)
  - routes/
  - controllers/
  - services/
  - middlewares/
  - db/ (optional)
- tests/

## API
- Base URL: /api
- Example routes (future):
  - GET /api/health -> 200 OK

## Getting Started (future)
1) mkdir server && cd server
2) npm init -y && npm i express zod && npm i -D typescript ts-node-dev @types/express eslint prettier
3) npx tsc --init
4) npm run dev

## Notes
- Keep API logic isolated from framework code (thin controllers, fat services).
- Add env vars via .env and do not commit secrets.
- Consider CORS config to allow client origin in development.
