# README.md

## NCAA Men's March Madness Tournament Tracker

A modern, TypeScript-based web application for tracking and managing the NCAA Men's March Madness Tournament. This interactive platform provides real-time bracket updates, game tracking, and comprehensive team statistics throughout the tournament.

## Features

- Interactive tournament bracket
- Game tracking and status updates
- Team management and information display
- User authentication and authorization
- Real-time scoring and leaderboard
- Multi-bracket support per user
- Historical tournament data tracking
- API documentation with Swagger
- Docker support for development and deployment
- Automatic bracket updates from NCAA official API
- Real-time winner/loser tracking
- Pick accuracy statistics
- Master bracket comparison
- Enhanced security headers using Helmet middleware
- Request logging using Winston
- Health check endpoint
- Swagger API documentation
- Rate limiting to prevent abuse
- Response compression for improved performance
- Request timeout handling
- Detailed error handling
- Graceful shutdown handling
- MongoDB connection error handling
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
│   │   └── scoreboard.routes.ts
│   ├── services
│   │   ├── bracketService.ts
│   │   ├── tournamentService.ts
│   │   └── scoreboardService.ts
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

1. Create a `.env` file in the root directory:

   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/march-madness
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   API_URL=http://localhost:3000/api
   LOG_LEVEL=info
   NCAA_API_KEY=your-api-key-here
   NCAA_API_URL=https://api.ncaa.com/casablanca/march-madness
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

## NCAA API Integration

The application integrates with the NCAA's official API to provide real-time tournament updates:

- Automatic game results updates with adaptive polling:
  - More frequent updates during game hours (12 PM - 11 PM)
  - Reduced polling during off-hours
  - Configurable update intervals
- Rate limiting protection
- Exponential backoff for failed requests
- Redis caching to minimize API calls

To use the NCAA API features:

1. Obtain an API key from the NCAA developer portal
2. Configure API settings in your `.env` file:

   ```
   NCAA_API_KEY=your-api-key-here
   NCAA_API_URL=https://api.ncaa.com/casablanca/march-madness
   NCAA_UPDATE_INTERVAL=60000
   NCAA_MAX_REQUESTS_PER_MINUTE=30
   NCAA_CACHE_TTL=300
   ```

The system will automatically:

- Cache responses for 5 minutes
- Limit API requests to 30 per minute
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

## Endpoints

- `/health`: Health check endpoint
- `/api-docs`: Swagger API documentation
- `/metrics`: Prometheus metrics endpoint

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

1. Build and start the containers:

    ```bash
    npm run docker:dev
    ```

2. Access the application at `http://localhost:3000`.

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

## Dev Dependencies

- ts-node
- jest
- @types/jest
- @types/node
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
