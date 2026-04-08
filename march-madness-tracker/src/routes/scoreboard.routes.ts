/// <reference path="../types/express.d.ts" />
import express from 'express';
import logger from '../config/logger';
import { ScoreboardService } from '../services/scoreboardService';
import { Scoreboard } from '../models/scoreboard';
import { auth } from '../middleware/auth';

const router = express.Router();
const scoreboardService = new ScoreboardService();

function handleServerError(res: express.Response, error: unknown) {
    logger.error('Scoreboard route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}

/**
 * @swagger
 * /api/scoreboard:
 *   get:
 *     summary: Get tournament leaderboard
 */
router.get('/', async (req, res) => {
    try {
        const year = req.query.year !== undefined ? Number(req.query.year) : undefined;

        if (req.query.year !== undefined && (!Number.isInteger(year) || (year as number) < 1939)) {
            return res.status(400).json({ error: 'Invalid year query parameter' });
        }

        const leaderboard = await scoreboardService.getLeaderboard(year);
        return res.json(leaderboard);
    } catch (error: unknown) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/scoreboard/user:
 *   get:
 *     summary: Get user's score details
 */
router.get('/user', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const scores = await Scoreboard.find({ userId: req.user.id })
            .sort({ year: -1 })
            .populate('bracketId');
        return res.json(scores);
    } catch (error: unknown) {
        return handleServerError(res, error);
    }
});

export const scoreboardRoutes = router;
