# README.md

## NCAA Men's March Madness Tournament Tracker

A modern, TypeScript-based web application for tracking and managing the NCAA Men's March Madness Tournament. This interactive platform provides real-time bracket updates, game tracking, and comprehensive team statistics throughout the tournament.

## Quick Start

Get up and running in 3 commands:

```bash
# 1. Start Docker containers
docker compose up -d

# 2. Register and login to get JWT token
TOKEN=$(curl -X POST http://localhost:3005/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Pass123!","username":"admin"}' && \
  curl -X POST http://localhost:3005/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Pass123!"}' | jq -r '.token')

# 3. Trigger bracket sync (or wait for automatic 6 AM daily sync)
curl -X POST http://localhost:3005/api/admin/sync/bracket \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

✅ **That's it!** Your March Madness bracket data is now syncing from ESPN.

**Next Steps:**
- Visit [http://localhost:3005/api-docs](http://localhost:3005/api-docs) to explore all API endpoints
- Check [http://localhost:3005/health](http://localhost:3005/health) to verify the app is running
- View logs: `docker logs march-madness-tracker-app-1 -f`

## What You'll See

This is a **backend API application** - there's no frontend UI. When you access `http://localhost:3005` in your browser, you'll see:

### Available Endpoints

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| [http://localhost:3005/health](http://localhost:3005/health) | Health check - confirms app is running | None |
| [http://localhost:3005/api-docs](http://localhost:3005/api-docs) | **Swagger UI** - Interactive API documentation | None |
| [http://localhost:3005/metrics](http://localhost:3005/metrics) | Prometheus metrics | None |
| `POST http://localhost:3005/api/users/register` | Register new user | None |
| `POST http://localhost:3005/api/users/login` | Login (get JWT token) | None |
| `POST http://localhost:3005/api/admin/sync/bracket` | Trigger bracket sync | JWT Required |
| `GET http://localhost:3005/api/admin/sync/status` | Get sync status | JWT Required |
| `GET http://localhost:3005/api/brackets` | List user brackets | JWT Required |
| `GET http://localhost:3005/api/scoreboard` | View scoreboard | None |

**👉 Start here:** Visit [http://localhost:3005/api-docs](http://localhost:3005/api-docs) to explore all available endpoints in an interactive UI.

**Note:** The root path `/` will show "Cannot GET /" - this is expected, as this is an API-only backend service.

## Features

- **Automatic ESPN Bracket Sync**: Daily updates at 6:00 AM from ESPN Scoreboard API
- **Manual Sync Controls**: Admin endpoints to trigger on-demand bracket updates
- Interactive tournament bracket
- Game tracking and status updates
- Team management and information display
- User authentication and authorization (JWT-based)
- Real-time scoring and leaderboard
- Multi-bracket support per user
- Historical tournament data tracking
- API documentation with Swagger
- Docker support for development and deployment
- Real-time winner/loser tracking
- Pick accuracy statistics
- Master bracket comparison
- Enhanced security headers using Helmet middleware
- Request logging using Winston
- Health check endpoint
- Rate limiting to prevent abuse
- Response compression for improved performance
- Request timeout handling
- Detailed error handling
- Graceful shutdown handling
- MongoDB + Redis caching
- Prometheus metrics for monitoring

## Project Structure

```
march-madness-tracker
├── src
│   ├── components
│   │   ├── Bracket.ts
│   │   ├── Game.ts
│   │   └── Team.ts
│   ├── config
│   │   ├── passport.ts
│   │   └── logger.ts
│   ├── middleware
│   │   └── auth.ts
│   ├── models
│   │   ├── game.ts
│   │   ├── team.ts
│   │   ├── user.ts
│   │   ├── bracket.ts
│   │   ├── scoreboard.ts
│   │   └── tournament.ts
│   ├── routes
│   │   ├── bracket.routes.ts
│   │   ├── user.routes.ts
│   │   ├── scoreboard.routes.ts
│   │   └── admin.routes.ts       # Admin sync endpoints
│   ├── services
│   │   ├── bracketService.ts
│   │   ├── bracketIngestionService.ts  # ESPN API integration
│   │   ├── schedulerService.ts         # Daily sync scheduler
│   │   ├── tournamentService.ts
│   │   ├── scoreboardService.ts
│   │   └── metricsService.ts
│   ├── utils
│   │   └── index.ts
│   └── app.ts
├── migrations
│   └── config.ts
├── tests
│   └── bracket.test.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- TypeScript (v4.5 or higher)
- MongoDB (v5.0 or higher)
- Redis (v6.0 or higher)
- Git
- Docker (optional, for containerized development)

## Environment Setup

The application uses environment variables for configuration. When using Docker Compose, these are already configured in `docker-compose.yml`:

**Docker Compose Environment (Recommended):**

```yaml
environment:
  - NODE_ENV=development
  - PORT=4000                    # Internal port (exposed as 3005)
  - MONGODB_URI=mongodb://mongo:27017/march-madness
  - REDIS_URL=redis://redis:6379
  - JWT_SECRET=your-secret-key-change-in-production-use-long-random-string-min-32-chars
  - JWT_EXPIRATION=3600          # 1 hour
  - LOG_LEVEL=info
```

**Local Development (.env file):**

If running without Docker, create a `.env` file in the root directory:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/march-madness
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRATION=3600
   API_URL=http://localhost:3000/api
   LOG_LEVEL=info
   
   # Data Source Configuration
   DATA_SOURCE_TYPE=espn
   ESPN_API_URL=https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
   ```

2. Start required services:

   ```bash
   # Start MongoDB
   sudo service mongod start
   
   # Start Redis
   sudo service redis start
   
   # Or using Docker
   docker-compose up -d mongodb redis
   ```

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd march-madness-tracker
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

## Usage

The application provides several features:

```bash
# Start in development mode with hot reloading
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate documentation
npm run docs

# Start with Docker
npm run docker:dev

# Run database migrations
npm run migrate:up
```

## Development

### Code Style

This project uses ESLint and Prettier for code formatting:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch
- Feature branches: `feature/branch-name`

## API Documentation

API documentation is available at `/api-docs` when running the development server. The documentation includes:

- User Authentication endpoints
- Bracket management
- Tournament updates
- Leaderboard and scoring
- Health check endpoints

### Admin Endpoints

Admin endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Available Admin Endpoints

**POST /api/admin/sync/bracket**
- Manually trigger a full bracket sync from ESPN
- Syncs all games from March 15 - April 10, 2026
- Returns success message with timestamp

**GET /api/admin/sync/status**
- Get current sync status and schedule information
- Shows last sync details

**Example Usage:**

```bash
# Get your JWT token first (see ESPN Integration section)
TOKEN="your-jwt-token-here"

# Trigger manual sync
curl -X POST http://localhost:3005/api/admin/sync/bracket \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Check sync status
curl -X GET http://localhost:3005/api/admin/sync/status \
  -H "Authorization: Bearer $TOKEN"
```

## NCAA API Integration

The application integrates with the NCAA's official API to provide real-time tournament updates:

- Automatic game results updates with adaptive polling:
  - More frequent updates during game hours (12 PM - 11 PM)
  - Reduced polling during off-hours
  - Configurable update intervals
- Rate limiting protection
- Exponential backoff for failed requests
- Redis caching to minimize API calls

## Data Sources

**Important: The NCAA does not provide a public API for March Madness data.**

This application supports multiple data source options:

### 1. Mock Data (Development)

For development and testing:

```env
DATA_SOURCE_TYPE=mock
```

Use pre-populated sample tournament data. Ideal for development and testing.

### 2. ESPN Unofficial API (Free, No Key Required) ⭐ **ACTIVE**

ESPN provides unofficial endpoints that are currently integrated and working:

```env
DATA_SOURCE_TYPE=espn
ESPN_API_URL=https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
```

**Note:** ESPN's API is unofficial and not guaranteed to remain available. Use at your own risk.

#### ESPN Integration Features

- **Automatic Daily Sync**: Runs every day at 6:00 AM to fetch latest game results
- **Full Tournament Coverage**: Syncs all games from March 15 - April 10, 2026
- **Manual Sync**: Admin endpoint available for on-demand bracket updates
- **Smart Parsing**: Automatically extracts team info, scores, and round numbers

#### Getting Started with ESPN Sync

**Step 1: Start the Docker Containers**

```bash
cd march-madness-tracker
docker compose up -d
```

The app will be available at `http://localhost:3005` (maps to internal port 4000).

**Step 2: Register a User and Get JWT Token**

```bash
# Register a new user
curl -X POST http://localhost:3005/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "username": "admin"
  }'

# Login to get JWT token
TOKEN=$(curl -X POST http://localhost:3005/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.token')

echo "Your token: $TOKEN"
```

**Step 3: Manually Trigger Bracket Sync (Optional)**

```bash
# Trigger full bracket sync
curl -X POST http://localhost:3005/api/admin/sync/bracket \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# Response:
# {
#   "success": true,
#   "message": "Bracket sync completed successfully",
#   "timestamp": "2026-03-17T15:30:00.000Z"
# }
```

**Step 4: Verify Synced Data**

```bash
# Check database stats
docker exec march-madness-tracker-mongo-1 mongo march-madness --quiet --eval "
print('Tournaments:', db.tournaments.count());
print('Games:', db.games.count());
print('Teams:', db.teams.count());
"

# Expected output:
# Tournaments: 1
# Games: 69
# Teams: 69
```

#### Automated Sync Schedule

The application automatically syncs bracket data daily at 6:00 AM. No manual intervention required during tournament season. Check logs:

```bash
docker logs march-madness-tracker-app-1 -f
```

### 3. SportsRadar API (Commercial)

Professional-grade sports data with official NCAA tournament coverage:

1. Sign up at [SportsRadar](https://developer.sportradar.com/)
2. Subscribe to NCAA Men's Basketball coverage
3. Configure:

   ```env
   DATA_SOURCE_TYPE=sportsradar
   SPORTSRADAR_API_KEY=your-api-key-here
   SPORTSRADAR_API_URL=https://api.sportradar.us/ncaamb/trial/v7/en
   NCAA_MAX_REQUESTS_PER_MINUTE=30
   NCAA_CACHE_TTL=300
   ```

### 4. Manual Data Entry

For complete control:

```env
DATA_SOURCE_TYPE=manual
```

Manually seed and update game results through admin endpoints.

### Alternative Data Sources

- **The Sports DB** - Free API with limited tournament data
- **Web Scraping** - NCAA.com or ESPN.com (check terms of service)
- **Odds Provider APIs** - Many sports betting APIs include NCAA data

The system will automatically:

- Cache responses for 5 minutes
- Limit API requests based on provider limits
- Update more frequently during tournament hours
- Handle rate limits and errors gracefully

## Bracket Comparison Features

The application now supports:

- Real-time comparison of user picks against official results
- Pick status tracking (correct/incorrect/pending)
- Detailed pick accuracy statistics
- Historical pick performance tracking

## Running Tests

To run the unit tests, use:

```bash
npm test
```

## Troubleshooting

Common issues and solutions:

- **Build fails**: Clear the dist folder and node_modules

  ```bash
  rm -rf dist node_modules
  npm install
  ```

- **Tests timeout**: Increase the timeout in jest.config.js

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.

## Setup

### Prerequisites

- Node.js
- Docker and Docker Compose

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/march-madness-tracker.git
    cd march-madness-tracker
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:

    ```env
    NODE_ENV=development
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/march-madness
    ```

### Running the Application

#### Using Node.js

1. Start the application:

    ```bash
    npm start
    ```

2. Access the application at `http://localhost:3000`.

#### Using Docker

The application uses Docker Compose with three services:
- **app**: Node.js application (port 3005 → 4000)
- **mongo**: MongoDB 4.4 database (port 27017)
- **redis**: Redis 7 cache (port 6379)

1. Build and start all containers:

    ```bash
    docker compose up -d
    ```

2. Access the application at `http://localhost:3005`.

3. View logs:

    ```bash
    docker logs march-madness-tracker-app-1 -f
    ```

4. Stop containers:

    ```bash
    docker compose down
    ```

5. Rebuild after code changes:

    ```bash
    docker compose build app
    docker compose up -d
    ```

### Testing

Run tests using Jest:

```bash
npm test
```

### Linting

Lint the code using ESLint:

```bash
npm run lint
```

### Documentation

Generate API documentation using Typedoc:

```bash
npm run docs
```

## Dependencies

- express
- typescript
- dotenv
- cors
- jsonwebtoken
- bcryptjs
- mongoose
- passport
- passport-jwt
- ioredis
- express-rate-limit
- winston
- class-validator
- helmet
- swagger-ui-express
- swagger-jsdoc
- migrate-mongo
- class-transformer
- prom-client
- joi
- axios
- limiter
- compression
- connect-timeout
- node-cron              # Job scheduler for daily bracket sync

## Dev Dependencies

- ts-node
- jest
- @types/jest
- @types/node
- @types/node-cron       # Types for node-cron
- nodemon
- eslint
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- typedoc
- @types/express
- @types/cors
- @types/jsonwebtoken
- @types/bcryptjs
- @types/passport
- @types/passport-jwt
- @types/mongoose
- @types/ioredis
- supertest
- @types/prom-client
- jest-mock-extended
- @types/compression
- @types/connect-timeout
