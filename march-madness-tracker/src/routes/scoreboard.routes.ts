import express from 'express';
import { ScoreboardService } from '../services/scoreboardService';
import { Scoreboard } from '../models/scoreboard';
import { auth } from '../middleware/auth';

const router = express.Router();
const scoreboardService = new ScoreboardService();

/**
 * @swagger
 * /api/scoreboard:
 *   get:
 *     summary: Get tournament leaderboard
 */
router.get('/', async (req, res) => {
    try {
        const year = req.query.year ? Number(req.query.year) : undefined;
        const leaderboard = await scoreboardService.getLeaderboard(year);
        res.json(leaderboard);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
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
        res.json(scores);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});

export const scoreboardRoutes = router;
