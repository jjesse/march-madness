# README.md

## NCAA Men's March Madness Tournament Tracker

A full-stack, TypeScript-based web application for tracking and managing the NCAA Men's March Madness Tournament. Users can register, create brackets, make picks, and track how their picks perform as games are completed — all through a responsive React frontend backed by a hardened Express/MongoDB API.

## Quick Start

```bash
# 1. Start Docker containers (API + MongoDB + Redis)
cd march-madness-tracker
docker compose up -d

# 2. Register and get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3005/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123!"}' | jq -r '.token')

# 3. Open the frontend
open http://localhost:5173
```

> First time? Register via the `/register` page in the UI, or via the API (see the **API** section below).

**Service URLs**

| Service | URL |
|---------|-----|
| React frontend (dev) | http://localhost:5173 |
| API + Swagger | http://localhost:3005 |
| Swagger UI | http://localhost:3005/api-docs |
| Health check | http://localhost:3005/health |
| Metrics | http://localhost:3005/metrics |

## What's Been Built

### Frontend (React / Vite)

A complete single-page application at `client/` built with React 18, TypeScript, Vite, and React Router.

**Pages**
- `/` — Home / landing page
- `/login` & `/register` — Authentication
- `/brackets` — List, create, and delete your brackets
- `/brackets/new` — Create a new named bracket
- `/brackets/:id` — Edit bracket metadata and make/save picks per game
- `/results` — Your per-bracket scoring history with round breakdowns
- `/leaderboard` — Full standings filtered by year
- `/profile` — Edit profile and change password

**Pick system**
- Each game in a bracket shows two team pick buttons
- Picks are saved to the backend by game ID
- Games lock automatically once they move to "in progress" or "completed"
- Pick status badges show `pending`, `correct`, or `incorrect` after scoring

**Auth / routing**
- JWT stored in `localStorage`, attached to every API request
- Protected routes redirect to `/login` if unauthenticated
- Expired sessions are detected via 401 response and cleared automatically

**Frontend stack**

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Dev server and bundler |
| React Router DOM | Client-side routing |
| Axios | HTTP client with interceptors |
| Vitest + Testing Library | Unit and integration tests |
| ESLint + jsx-a11y | Linting and accessibility checks |

### Backend (Express / MongoDB)

| Feature | Detail |
|---------|--------|
| Authentication | JWT via Passport.js; bcrypt password hashing |
| Bracket management | CRUD + per-game pick storage and lock enforcement |
| Master bracket sync | ESPN Unofficial API, daily 6 AM cron + manual admin trigger |
| Scoring | `scoreboardService` evaluates picks against game results |
| Leaderboard | Ranked standings by year with round-by-round breakdowns |
| Security | Helmet, rate limiting, input validation (Joi), XSS sanitization |
| Observability | Winston logging, Prometheus metrics, health check endpoint |
| Caching | Redis for session-level bracket data |
| Database migrations | `migrate-mongo` manages indexes and seed structure |

## Project Structure

```
march-madness-tracker/
├── client/                        # React / Vite frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.cjs
│   └── src/
│       ├── main.tsx
│       ├── App.tsx               # Routes + ProtectedRoute wiring
│       ├── styles.css
│       ├── components/           # Reusable UI components
│       │   ├── AlertMessage.tsx
│       │   ├── AuthCard.tsx
│       │   ├── BracketMatchupCard.tsx
│       │   ├── BracketRoundSection.tsx
│       │   ├── EmptyState.tsx
│       │   ├── Layout.tsx
│       │   ├── LeaderboardTable.tsx
│       │   ├── LoadingSpinner.tsx
│       │   ├── PageHeader.tsx
│       │   └── ProtectedRoute.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx   # User session state
│       ├── hooks/
│       │   └── useAuth.ts
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── MyBracketsPage.tsx
│       │   ├── BracketPage.tsx
│       │   ├── BracketDetailsPage.tsx
│       │   ├── LeaderboardPage.tsx
│       │   ├── ResultsPage.tsx
│       │   ├── ProfilePage.tsx
│       │   └── NotFoundPage.tsx
│       ├── services/
│       │   ├── api.ts            # Axios instance + auth interceptors
│       │   ├── authService.ts
│       │   ├── bracketService.ts # Normalizes all API responses
│       │   ├── scoreboardService.ts
│       │   └── userService.ts
│       ├── types/
│       │   └── index.ts          # Shared types incl. NormalizedGame/Bracket
│       ├── utils/
│       │   └── normalize.ts      # normalizeGame, normalizeBracket,
│       │                         # groupGamesByRound, ROUND_LABELS
│       └── test/
│           └── setup.ts          # jest-dom matchers
│
├── src/                          # Express / TypeScript API
│   ├── app.ts
│   ├── components/
│   │   ├── Bracket.ts
│   │   ├── Game.ts
│   │   └── Team.ts
│   ├── config/
│   │   ├── logger.ts
│   │   └── passport.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── security.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── bracket.ts
│   │   ├── game.ts
│   │   ├── scoreboard.ts
│   │   ├── team.ts
│   │   ├── tournament.ts
│   │   └── user.ts
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── bracket.routes.ts
│   │   ├── scoreboard.routes.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   ├── bracketIngestionService.ts
│   │   ├── bracketService.ts
│   │   ├── masterBracketService.ts
│   │   ├── metricsService.ts
│   │   ├── schedulerService.ts
│   │   ├── scoreboardService.ts
│   │   └── tournamentService.ts
│   ├── types/
│   │   ├── errors.ts
│   │   └── express.d.ts
│   └── utils/
│       └── index.ts
├── migrations/
│   └── config.ts
├── tests/
│   └── bracket.test.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js v20+
- npm v9+
- Docker and Docker Compose (recommended)
- MongoDB 5+ and Redis 6+ (if running without Docker)

## Environment Setup

**Docker Compose (recommended)** — variables are pre-configured in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development
  - PORT=4000                    # Internal port (exposed as 3005)
  - MONGODB_URI=mongodb://mongo:27017/march-madness
  - REDIS_URL=redis://redis:6379
  - JWT_SECRET=change-me-min-32-chars-random-string
  - JWT_EXPIRATION=3600
  - LOG_LEVEL=info
```

**Local development** — create `.env` in `march-madness-tracker/`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/march-madness
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=3600
LOG_LEVEL=info

# Data source: mock | espn | sportsradar | manual
DATA_SOURCE_TYPE=espn
ESPN_API_URL=https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
```

## Installation

```bash
git clone https://github.com/jjesse/march-madness.git
cd march-madness/march-madness-tracker
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

## Running the Application

### Docker (recommended)

One command starts all four services — API, frontend, MongoDB, and Redis:

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| React frontend | http://localhost:5173 |
| Express API | http://localhost:3005 |
| Swagger UI | http://localhost:3005/api-docs |

The frontend Vite proxy resolves `/api` calls to the `app` container internally — no manual configuration needed.

**First-time setup:** after the containers are healthy, seed the bracket data:

```bash
# 1. Register at http://localhost:5173/register
# 2. Log in and copy your token, then run:
curl -X POST http://localhost:3005/api/admin/sync/bracket \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Useful Docker commands:**

```bash
docker compose logs -f app       # Stream API logs
docker compose logs -f frontend  # Stream frontend logs
docker compose down              # Stop all services
docker compose build app         # Rebuild API image after code changes
```

### Local development (without Docker)

```bash
# Terminal 1: API server
npm run dev

# Terminal 2: React frontend
cd client && npm run dev
```

### Other backend scripts

```bash
npm run build          # Compile TypeScript
npm start              # Run compiled output
npm run lint           # ESLint
npm run lint:fix       # Auto-fix lint issues
npm test               # Jest backend tests
npm run migrate:up     # Apply pending DB migrations
npm run migrate:down   # Roll back last migration
npm run docs           # Generate TypeDoc
```

### Frontend scripts (run from `client/`)

```bash
npm run dev            # Vite dev server on :5173 (proxies /api to :3005)
npm run build          # Production build
npm run lint           # ESLint + jsx-a11y
npm test               # Vitest unit tests
npm run test:watch     # Vitest in watch mode
```

## Database Migrations

`migrate-mongo` manages core indexes and the seeded tournament structure.

```bash
# From march-madness-tracker/ with MONGODB_URI set
npm run migrate:up      # Apply all pending migrations
npm run migrate:down    # Roll back most recent migration
npm run migrate:create -- add-my-change   # New migration file
```

## API Reference

Full interactive docs at **http://localhost:3005/api-docs** (Swagger UI).

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | None | Create account |
| POST | `/api/users/login` | None | Sign in, returns JWT |
| GET | `/api/users/profile` | JWT | Get own profile |
| PUT | `/api/users/profile` | JWT | Update profile |
| PUT | `/api/users/password` | JWT | Change password |

### Brackets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/brackets` | JWT | List my brackets |
| POST | `/api/brackets` | JWT | Create bracket |
| GET | `/api/brackets/:id` | JWT | Get bracket + games |
| PUT | `/api/brackets/:id` | JWT | Update bracket + picks |
| DELETE | `/api/brackets/:id` | JWT | Delete bracket |

**Saving picks** — include a `games` array in the PUT body:

```json
{
  "name": "My Bracket",
  "games": [
    { "_id": "<game-mongo-id>", "id": "<game-id>", "userPick": "Team Name" }
  ]
}
```

Picks for games that are `in progress` or `completed` are rejected with a 400 error.

### Scoreboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/scoreboard?year=2026` | None | Full leaderboard |
| GET | `/api/scoreboard/user` | JWT | My score history |

### Admin

All admin endpoints require JWT.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/sync/bracket` | Trigger ESPN bracket sync |
| GET | `/api/admin/sync/status` | Last sync status + schedule |

```bash
TOKEN="your-jwt-token"

# Trigger sync
curl -X POST http://localhost:3005/api/admin/sync/bracket \
  -H "Authorization: Bearer $TOKEN"

# Check status
curl http://localhost:3005/api/admin/sync/status \
  -H "Authorization: Bearer $TOKEN"
```

## ESPN Integration

The application integrates with ESPN's unofficial scoreboard API:

- **Automatic daily sync** at 6:00 AM via `node-cron`
- **Manual sync** via the admin endpoint above
- Covers all games March 15 – April 10, 2026
- Smart parsing extracts team names, scores, round numbers, and game status
- Redis caching reduces redundant API calls

> ESPN's API is unofficial and may change without notice.

## Data Sources

| Option | `DATA_SOURCE_TYPE` | Notes |
|--------|-------------------|-------|
| ESPN (default) | `espn` | Free, unofficial, currently active |
| Mock | `mock` | Pre-seeded data for development |
| SportsRadar | `sportsradar` | Commercial, requires API key |
| Manual | `manual` | Seed via admin endpoints |

## Testing

### Backend

```bash
npm test
```

Jest tests in `tests/` cover route behaviour, pick locking, and scoring logic.

### Frontend

```bash
cd client && npm test
```

Vitest + Testing Library tests cover:
- Core UI components (`AlertMessage`, `AuthCard`, `LeaderboardTable`, `BracketMatchupCard`, `ProtectedRoute`)
- Auth pages — login success/failure, registration validation and password mismatch
- Navigation — authenticated vs. public nav, logout
- Protected routing — redirect when unauthenticated, spinner during load, content when authenticated
- Page-level integration — bracket pick selection + save flow, leaderboard load and year filter

## Security

- **Helmet** — security headers on all responses
- **Rate limiting** — per-IP limits on auth and API routes
- **Input validation** — Joi schemas on all mutating endpoints
- **bcrypt** — password hashing (cost factor 12)
- **JWT** — short-lived tokens; expired tokens detected and cleared client-side
- **XSS protection** — safe error messages; no raw HTML rendered from API data
- **Lock enforcement** — pick edits rejected server-side once a game is no longer `not started`

## Troubleshooting

**Build fails**
```bash
rm -rf dist node_modules && npm install
```

**Frontend can't reach the API**
The Vite dev server proxies `/api` requests to `http://localhost:3000` by default. Set `VITE_API_PROXY_TARGET` in `client/.env` to override:
```env
VITE_API_PROXY_TARGET=http://localhost:3000
```

**MongoDB / Redis connection errors**
```bash
docker compose ps          # Check containers are running
docker compose logs mongo  # Inspect MongoDB logs
docker compose logs app    # Inspect API logs
```

**Sync not picking up new games**
Trigger a manual sync and check the app log for errors from the ESPN API:
```bash
docker logs march-madness-tracker-app-1 --tail 50
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

- Branch from `feature/` for new work
- Run `npm run lint` and `npm test` before opening a PR
- Frontend changes: also run `cd client && npm run lint && npm test`

## License

This project is licensed under the MIT License.
