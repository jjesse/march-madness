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
import './config/passport';

dotenv.config();

const logger = createLogger({
    // Add winston configuration here
});

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/march-madness');

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Add security headers
app.use(helmet());

// Add request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
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

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack);
    res.status(500).send({ error: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

export default app;