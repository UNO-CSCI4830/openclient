# OpenClient

A browser-based OpenAPI client built with React and Vite. Parses OpenAPI 3.x and Swagger 2.0 specifications and provides documentation browsing, request construction, and execution.

> **Note:** This project is under active development. Features below reflect the current state.

## Getting Started

### Prerequisites

- Node.js (v18+)

### Install and Run

```bash
npm install
npm run dev
```

### Other Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |

## Testing

Tests live in `tests/features/`, mirroring the `src/features/` structure.

Here are a few examples:

```bash
# Run all tests
npm test

# Run tests for a specific feature
npx vitest run tests/features/specParsing

# Run a specific test file
npx vitest run tests/features/specParsing/parseSpec.test.js

# Filter by filename (matches any test file containing the string)
npx vitest run metadata

# Filter by test or describe name
npx vitest run -t "endpoints"
```

## Features

- **Spec Input** — Provide an OpenAPI spec via paste, file upload, or URL
- **Spec Validation** — Structural checks and schema validation (powered by swagger-parser)
- **Spec Parsing** — Transforms a validated spec into an internal API model for downstream features
- **Metadata View** — Displays spec metadata (title, version, servers, tags, endpoint/schema counts)
- **Endpoint List** — Browse endpoints grouped by tag, with detail panels for parameters, request bodies, and responses
- **Schema List** — Browse component schemas with detail panels and usage tracking

## Tech Stack

- React 19, Vite, plain CSS
- [swagger-parser](https://github.com/APIDevTools/swagger-parser) for spec validation and dereferencing
- Vitest for testing