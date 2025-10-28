# Client

This directory holds the React + Vite + TypeScript client.

## Tech Stack
- React 18 + TypeScript
- Vite for dev server and build
- ESLint + Prettier (recommended)
- Vitest + Testing Library (optional next step)

## Scripts (to be added when scaffolding)
- dev: Start Vite dev server
- build: Type-check and build for production
- preview: Preview production build locally
- test: Run unit tests

## Suggested Structure
- src/
  - main.tsx, App.tsx
  - components/
  - pages/
  - hooks/
  - lib/
- public/

## Getting Started (future)
1) npx create-vite@latest client -- --template react-swc-ts
2) cd client && pnpm install (or npm/yarn)
3) pnpm dev

## Notes
- Keep UI-specific logic in client; call server API via environment-based base URL.
- Keep config minimal; add libs only when needed.
