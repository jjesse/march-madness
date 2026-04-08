import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';
import helmet from 'helmet';
import { bracketRoutes } from './routes/bracket.routes';
import { userRoutes } from './routes/user.routes';
import { scoreboardRoutes } from './routes/scoreboard.routes';
import adminRoutes from './routes/admin.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import timeout from 'connect-timeout';
import promClient from 'prom-client';
import './config/passport';
import logger from './config/logger';
import { getRedisHealth } from './config/redis';
import { auth, requireAdmin } from './middleware/auth';
import { SchedulerService } from './services/schedulerService';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
let server: ReturnType<typeof app.listen> | null = null;
let schedulerService: SchedulerService | null = null;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

export async function connectDatabase(): Promise<void> {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/march-madness');
}

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
});

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        logger.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: [
                "'self'",
                'https://site.api.espn.com',
                'https://api.sportradar.com',
                'https://api.sportradar.us'
            ]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    }
}));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

app.use(limiter);
app.use(compression());
app.use(timeout('5s'));

promClient.collectDefaultMetrics({ prefix: 'march_madness_' });

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code']
});

const metricsHandler = async (_req: Request, res: Response) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
};

if (process.env.PUBLIC_METRICS === 'true') {
    app.get('/metrics', metricsHandler);
} else {
    app.get('/metrics', auth, requireAdmin, metricsHandler);
}

app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({
            method: req.method,
            route: req.route?.path || req.path || 'unknown',
            code: String(res.statusCode)
        });
    });
    next();
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'March Madness API',
            version: '1.0.0'
        }
    },
    apis: ['./src/routes/*.ts']
};

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongoStatus: mongoose.connection.readyState === 1 ? 'up' : 'down',
        redisStatus: getRedisHealth()
    });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));
app.use('/api/users', userRoutes);
app.use('/api/brackets', passport.authenticate('jwt', { session: false }), bracketRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
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

    return res.status(500).json({
        error: 'Something went wrong',
        id: (req as any).id
    });
});

const gracefulShutdown = (): void => {
    logger.info('Starting graceful shutdown');
    schedulerService?.stopAllJobs();

    if (server) {
        server.close(async () => {
            logger.info('Server closed');
            await mongoose.connection.close(false);
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
        return;
    }

    void mongoose.connection.close(false).then(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
    });
};

export async function startServer(): Promise<ReturnType<typeof app.listen>> {
    await connectDatabase();

    return await new Promise((resolve) => {
        server = app.listen(port, () => {
            logger.info(`Server running at http://localhost:${port}`);
            schedulerService = new SchedulerService();
            schedulerService.initializeScheduledJobs();
            logger.info('Bracket ingestion scheduler initialized');
            resolve(server as ReturnType<typeof app.listen>);
        });
    });
}

if (require.main === module && process.env.NODE_ENV !== 'test') {
    void startServer().catch((error) => {
        logger.error('Server startup failed:', error);
        process.exit(1);
    });

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

export default app;