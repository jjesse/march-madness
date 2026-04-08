/// <reference path="../types/express.d.ts" />
import express from 'express';
import logger from '../config/logger';
import { auth, requireAdmin } from '../middleware/auth';
import { Game } from '../models/game';
import { Tournament } from '../models/tournament';
import { BracketIngestionService } from '../services/bracketIngestionService';

const router = express.Router();
const ingestionService = new BracketIngestionService();
const allowedStatuses = new Set(['not started', 'in progress', 'completed']);

router.use(auth, requireAdmin);

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateManualGamePayload(payload: Record<string, unknown>, allowPartial = false) {
    const data: Record<string, unknown> = {};

    if (!allowPartial || payload.id !== undefined) {
        if (payload.id !== undefined) {
            if (!isNonEmptyString(payload.id)) {
                return { error: 'id must be a non-empty string' };
            }
            data.id = payload.id.trim();
        }
    }

    if (!allowPartial || payload.teamA !== undefined) {
        if (!isNonEmptyString(payload.teamA)) {
            return { error: 'teamA is required and must be a non-empty string' };
        }
        data.teamA = payload.teamA.trim();
    }

    if (!allowPartial || payload.teamB !== undefined) {
        if (!isNonEmptyString(payload.teamB)) {
            return { error: 'teamB is required and must be a non-empty string' };
        }
        data.teamB = payload.teamB.trim();
    }

    if (payload.scoreA !== undefined || !allowPartial) {
        const scoreA = Number(payload.scoreA ?? 0);
        if (!Number.isInteger(scoreA) || scoreA < 0) {
            return { error: 'scoreA must be a non-negative integer' };
        }
        data.scoreA = scoreA;
    }

    if (payload.scoreB !== undefined || !allowPartial) {
        const scoreB = Number(payload.scoreB ?? 0);
        if (!Number.isInteger(scoreB) || scoreB < 0) {
            return { error: 'scoreB must be a non-negative integer' };
        }
        data.scoreB = scoreB;
    }

    if (payload.status !== undefined || !allowPartial) {
        const status = String(payload.status ?? 'not started').trim().toLowerCase();
        if (!allowedStatuses.has(status)) {
            return { error: 'status must be one of: not started, in progress, completed' };
        }
        data.status = status;
    }

    if (payload.round !== undefined || !allowPartial) {
        const round = Number(payload.round ?? 1);
        if (!Number.isInteger(round) || round < 0 || round > 6) {
            return { error: 'round must be an integer between 0 and 6' };
        }
        data.round = round;
    }

    if (payload.region !== undefined || !allowPartial) {
        const region = String(payload.region ?? 'Unknown').trim();
        if (!region) {
            return { error: 'region must be a non-empty string' };
        }
        data.region = region;
    }

    if (payload.winnerId !== undefined) {
        if (!isNonEmptyString(payload.winnerId)) {
            return { error: 'winnerId must be a non-empty string when provided' };
        }
        data.winnerId = payload.winnerId.trim();
    }

    if (payload.winnerName !== undefined) {
        if (!isNonEmptyString(payload.winnerName)) {
            return { error: 'winnerName must be a non-empty string when provided' };
        }
        data.winnerName = payload.winnerName.trim();
    }

    if (payload.startTime !== undefined || !allowPartial) {
        const rawStartTime = payload.startTime ?? new Date().toISOString();
        const startTime = new Date(String(rawStartTime));
        if (Number.isNaN(startTime.getTime())) {
            return { error: 'startTime must be a valid date/time value' };
        }
        data.startTime = startTime;
    }

    if (payload.year !== undefined || !allowPartial) {
        const year = Number(payload.year ?? new Date().getFullYear());
        if (!Number.isInteger(year) || year < 1939 || year > 2100) {
            return { error: 'year must be a valid tournament year' };
        }
        data.year = year;
    }

    if (allowPartial && Object.keys(data).length === 0) {
        return { error: 'No valid fields provided for update' };
    }

    return { data };
}

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
        logger.info(`Manual bracket sync triggered by admin ${req.user?.id}`);

        await ingestionService.syncBracket();

        return res.json({
            success: true,
            message: 'Bracket sync completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Manual bracket sync failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
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
router.get('/sync/status', async (_req, res) => {
    try {
        return res.json({
            success: true,
            message: 'Sync status endpoint',
            timestamp: new Date().toISOString(),
            info: 'Daily bracket sync runs at 6:00 AM, includes final scores for completed games'
        });
    } catch (error) {
        logger.error('Sync status request failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

async function getOrCreateTournament(year: number) {
    let tournament = await Tournament.findOne({ year });

    if (!tournament) {
        tournament = new Tournament({
            year,
            name: `NCAA Men's Basketball Tournament ${year}`,
            status: 'upcoming',
            startDate: new Date(Date.UTC(year, 2, 15)),
            endDate: new Date(Date.UTC(year, 3, 10)),
            games: []
        });
        await tournament.save();
    }

    return tournament;
}

/**
 * @swagger
 * /api/admin/manual/games:
 *   post:
 *     summary: Seed or upsert a manual tournament game for development/testing
 *     tags: [Admin]
 */
router.post('/manual/games', async (req, res) => {
    try {
        const validation = validateManualGamePayload(req.body as Record<string, unknown>);
        if (validation.error) {
            return res.status(400).json({ error: validation.error });
        }

        const { data } = validation;
        const year = Number(data?.year ?? new Date().getFullYear());
        const tournament = await getOrCreateTournament(year);
        const manualGameId = typeof data?.id === 'string' ? data.id : `manual-${Date.now()}`;

        const game = await Game.findOneAndUpdate(
            { id: manualGameId },
            {
                id: manualGameId,
                teamA: data?.teamA,
                teamB: data?.teamB,
                scoreA: data?.scoreA,
                scoreB: data?.scoreB,
                status: data?.status,
                round: data?.round,
                region: data?.region,
                winnerId: data?.winnerId,
                winnerName: data?.winnerName,
                startTime: data?.startTime,
                bracketId: tournament._id
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        if (game && !tournament.games.some((existingId) => existingId.toString() === game._id.toString())) {
            tournament.games.push(game._id);
            await tournament.save();
        }

        return res.status(201).json({
            success: true,
            game,
            tournamentId: tournament._id
        });
    } catch (error) {
        logger.error('Manual game seed failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/admin/manual/games/{id}:
 *   patch:
 *     summary: Update a manually seeded tournament game
 *     tags: [Admin]
 */
router.patch('/manual/games/:id', async (req, res) => {
    try {
        if (!isNonEmptyString(req.params.id)) {
            return res.status(400).json({ error: 'Game id is required' });
        }

        const validation = validateManualGamePayload(req.body as Record<string, unknown>, true);
        if (validation.error) {
            return res.status(400).json({ error: validation.error });
        }

        const updates = { ...validation.data };
        delete updates.year;
        delete updates.id;

        const game = await Game.findOneAndUpdate(
            { id: req.params.id.trim() },
            updates,
            { new: true, runValidators: true }
        );

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        return res.json({ success: true, game });
    } catch (error) {
        logger.error('Manual game update failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
