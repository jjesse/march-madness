import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';
import helmet from 'helmet';
import { createLogger } from 'winston';
import { bracketRoutes } from './routes/bracket.routes';
import { userRoutes } from './routes/user.routes';
import { scoreboardRoutes } from './routes/scoreboard.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import timeout from 'connect-timeout';
import promClient from 'prom-client';
import './config/passport';

dotenv.config();

const logger = createLogger({
    // Add winston configuration here
});

const app = express();
const port = process.env.PORT || 3000;

// Add rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// MongoDB connection with error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/march-madness')
    .catch(err => {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    });

mongoose.connection.on('error', err => {
    logger.error('MongoDB error:', err);
});

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Enhance security headers configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.ncaa.com"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: "deny"
    }
}));

// Add security middleware before routes
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Add request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Add additional middleware
app.use(limiter);
app.use(compression());
app.use(timeout('5s'));

// Initialize Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Create a custom histogram metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code']
});

// Add metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// Add request duration tracking
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path, code: res.statusCode });
    });
    next();
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'March Madness API',
            version: '1.0.0',
        },
    },
    apis: ['./src/routes/*.ts'],
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        mongoStatus: mongoose.connection.readyState === 1
    });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/brackets', passport.authenticate('jwt', { session: false }), bracketRoutes);
app.use('/api/scoreboard', scoreboardRoutes);

// Improve error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.status(500).json({ 
        error: 'Something went wrong',
        id: req.id // Add request ID for tracking
    });
});

// Graceful shutdown handling
const gracefulShutdown = () => {
    server.close(() => {
        logger.info('Server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
};

const server = app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;