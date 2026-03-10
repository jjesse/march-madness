# TODO — March Madness Tracker

A prioritized list of everything remaining to make the application fully functional, tested, and production-ready.

---

## 🔴 Critical — App Will Not Start Without These

- [x] **Create `src/config/passport.ts`** — Passport JWT strategy is imported by `app.ts` but the file does not exist. The server crashes on startup without it.
- [x] **Create `src/routes/bracket.routes.ts`** — Imported by `app.ts`; bracket CRUD endpoints are completely missing.
- [x] **Create `src/routes/user.routes.ts`** — Imported by `app.ts`; user authentication and profile endpoints are completely missing.
- [x] **Fix error-handler middleware imports in `app.ts`** — The global error handler references `Request`, `Response`, and `NextFunction` from Express but does not import them; `req.id` is also referenced without being set.
- [x] **Fix missing imports in `src/routes/scoreboard.routes.ts`** — `Scoreboard`, `Bracket`, and `auth` middleware are used but not imported.
- [x] **Fix missing `Bracket` model import in `src/services/scoreboardService.ts`**.

---

## 🟠 High Priority — Core Features

### Authentication & Users
- [ ] Implement **user registration** endpoint (`POST /api/users/register`) with password hashing via bcryptjs.
- [ ] Implement **user login** endpoint (`POST /api/users/login`) that issues a signed JWT.
- [ ] Implement **token refresh** or logout endpoint.
- [ ] Implement **change password** endpoint (authenticated).
- [ ] Implement **get / update user profile** endpoint (authenticated).
- [ ] Add input validation (email format, password strength) to all user endpoints.

### Bracket Routes
- [ ] Implement `POST /api/brackets` — create a new bracket for the authenticated user.
- [ ] Implement `GET /api/brackets` — list all brackets owned by the authenticated user.
- [ ] Implement `GET /api/brackets/:id` — get a single bracket.
- [ ] Implement `PUT /api/brackets/:id` — update picks in a bracket.
- [ ] Implement `DELETE /api/brackets/:id` — delete a bracket.
- [ ] Enforce ownership checks so users can only modify their own brackets.

### Models
- [ ] Convert `src/models/team.ts` from a bare TypeScript interface to a proper Mongoose schema/model so teams can be persisted.
- [ ] Convert `src/models/tournament.ts` from a bare TypeScript interface to a proper Mongoose schema/model; fix the missing `GameModel` import.

---

## 🟡 Medium Priority — Stability & Quality

### Tests
- [ ] Add `jest.config.js` (or `jest.config.ts`) with TypeScript transform settings and timeout configuration (README references this file but it does not exist).
- [ ] Rewrite `tests/bracket.test.ts` — test cases call `getGames()`, `addGame()`, `getScore()`, `getWinner()`, `getNextRoundTeams()`, and a string-returning `render()`, none of which exist on the `Bracket` component. Tests should be rewritten to match the actual public API.
- [ ] Add unit tests for `BracketService`, `ScoreboardService`, `TournamentService`, and `MasterBracketService`.
- [ ] Add integration tests for all REST endpoints using `supertest`.
- [ ] Add tests for authentication middleware and security middleware.

### Configuration & Tooling
- [ ] Add `.eslintrc.js` (or `.eslintrc.json`) — ESLint is listed as a dependency and `npm run lint` is documented, but no config file exists.
- [ ] Add `.prettierrc` if Prettier is intended (README mentions it alongside ESLint).
- [ ] Verify that `tsconfig.json` `outDir` and `rootDir` settings are correct for the build output.
- [ ] Verify that `jest` and `ts-jest` (or `babel-jest`) are listed in `devDependencies` inside `package.json` and install them if missing.

### Database Migrations
- [ ] Create an initial migration that sets up indexes for `users`, `brackets`, `games`, and `scoreboard` collections.
- [ ] Create a migration that seeds tournament regions, rounds, and team slots for a given year.
- [ ] Document how to run migrations in the README (`npm run migrate:up`).

### Redis / Caching
- [ ] Initialise the Redis client as a singleton and expose a shared instance so services do not open multiple connections.
- [ ] Add Redis health check to the `/health` endpoint response.
- [ ] Handle Redis connection errors gracefully (log and fall back to direct DB reads).

---

## 🟢 Lower Priority — Polish & Production Readiness

### API & Documentation
- [ ] Add full Swagger/OpenAPI JSDoc annotations to **all** route handlers (bracket, user, scoreboard) so `/api-docs` is complete and accurate.
- [ ] Remove duplicate "Setup / Installation" sections from `README.md` and consolidate into a single clear guide.
- [ ] Add API versioning (`/api/v1/...`) or document the versioning strategy.
- [ ] Add `CONTRIBUTING.md` with coding standards, PR process, and branch strategy.

### Security
- [ ] Move `.env` out of version control (add to `.gitignore`) and replace with `.env.example` containing placeholder values.
- [ ] Rotate or invalidate the example `JWT_SECRET` value committed in `.env`.
- [ ] Set a token expiry (`expiresIn`) when signing JWTs.
- [ ] Validate and sanitise all user-supplied IDs (bracket ID, user ID) to prevent injection.
- [ ] Review Content Security Policy settings in `security.ts` for production domains.

### Monitoring & Logging
- [ ] Ensure Winston console transport is enabled in `development` mode and file transports only in `production`.
- [ ] Add structured request-ID middleware (e.g., `express-request-id` or a UUID generator) so `req.id` is always set and traceable in logs.
- [ ] Add a `/metrics` auth guard or firewall rule so Prometheus metrics are not publicly accessible.

### Docker & CI/CD
- [ ] Add **Redis** service to `docker-compose.yml` (only MongoDB is currently defined).
- [ ] Add a `docker-compose.override.yml` for local development overrides.
- [ ] Create a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs `npm run lint`, `npm run build`, and `npm test` on every pull request.
- [ ] Add a `Dockerfile` multi-stage build to separate build and runtime stages for a smaller production image.
- [ ] Document deployment steps (environment variable injection, rolling updates, etc.).

### Frontend / UI
- [ ] Decide whether the project is API-only or will include a web frontend — the `src/components/` directory contains `Bracket.ts`, `Game.ts`, and `Team.ts` UI-style components that are not wired to any frontend framework.
- [ ] If a frontend is planned: scaffold it (React, Vue, etc.) and connect to the REST API.
- [ ] If API-only: remove or repurpose the `src/components/` files and update the README to clarify scope.

### Code Clean-up
- [ ] Resolve the duplicate `package.json` situation — there is a root-level `package.json` (workspaces config) and a `march-madness-tracker/package.json`; make sure scripts work from both locations.
- [ ] Delete the empty `changelog` file at the repository root (content lives in `march-madness-tracker/CHANGELOG.md`).
- [ ] Audit and reconcile the two different version numbers for several packages listed in `package.json` (e.g., `helmet` lists `5.0.0` and `7.1.0`, `express-rate-limit` lists `6.0.0` and `7.1.5`).
- [ ] Add `node_modules/`, `dist/`, and `*.log` to `.gitignore` if not already present.
