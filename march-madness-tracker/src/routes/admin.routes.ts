/// <reference path="../types/express.d.ts" />
import express from 'express';
import { auth } from '../middleware/auth';
import { BracketIngestionService } from '../services/bracketIngestionService';
import logger from '../config/logger';

const router = express.Router();
const ingestionService = new BracketIngestionService();

// Apply auth middleware - in production, add admin-only middleware
router.use(auth);

/**
 * @swagger
 * /api/admin/sync/bracket:
 *   post:
 *     summary: Manually trigger a full bracket sync from ESPN
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bracket sync completed successfully
 *       500:
 *         description: Bracket sync failed
 */
router.post('/sync/bracket', async (req, res) => {
    try {
        logger.info(`Manual bracket sync triggered by user ${req.user?.id}`);
        
        await ingestionService.syncBracket();
        
        res.json({ 
            success: true, 
            message: 'Bracket sync completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Manual bracket sync failed:', error);
        res.status(500).json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

/**
 * @swagger
 * /api/admin/sync/scores:
 *   post:
 *     summary: Manually trigger a live scores sync from ESPN
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date in YYYYMMDD format (optional, defaults to today)
 *     responses:
 *       200:
 *         description: Scores sync completed successfully
 *       500:
 *         description: Scores sync failed
 */
router.post('/sync/scores', async (req, res) => {
    try {
        const date = req.query.date as string | undefined;
        
        logger.info(`Manual scores sync triggered by user ${req.user?.id} for date: ${date || 'today'}`);
        
        await ingestionService.syncLiveScores(date);
        
        res.json({ 
            success: true, 
            message: 'Live scores sync completed successfully',
            timestamp: new Date().toISOString(),
            date: date || 'today'
        });
    } catch (error) {
        logger.error('Manual scores sync failed:', error);
        res.status(500).json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

/**
 * @swagger
 * /api/admin/sync/status:
 *   get:
 *     summary: Get the current sync status and last sync time
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status information
 */
router.get('/sync/status', async (req, res) => {
    try {
        // This could be enhanced to track actual sync times in Redis or DB
        res.json({ 
            success: true,
            message: 'Sync status endpoint',
            timestamp: new Date().toISOString(),
            info: 'Bracket and score syncs are available via POST endpoints'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

export default router;
