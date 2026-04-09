/// <reference path="../types/express.d.ts" />
import express from 'express';
import mongoose from 'mongoose';
import logger from '../config/logger';
import { Bracket } from '../models/bracket';
import { Game } from '../models/game';
import { auth } from '../middleware/auth';

const router = express.Router();

router.use(auth);

function validateBracketId(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid bracket id' });
    }

    return next();
}

function handleServerError(res: express.Response, error: unknown) {
    logger.error('Bracket route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}

function normalizePickValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function canEditGamePick(status: string): boolean {
    return status === 'not started';
}

async function syncBracketGames(bracket: any) {
    const masterBracket = await Bracket.findOne({
        year: bracket.year,
        isMaster: true
    }).populate('games');

    if (!masterBracket || !Array.isArray(masterBracket.games) || masterBracket.games.length === 0) {
        return await bracket.populate('games');
    }

    const existingGames = await Game.find({ bracketId: bracket._id });
    const existingByGameId = new Map(existingGames.map((game) => [game.id, game]));
    const syncedGameIds: mongoose.Types.ObjectId[] = [];

    for (const masterGame of masterBracket.games as any[]) {
        const gameDoc = existingByGameId.get(masterGame.id) || new Game({
            id: masterGame.id,
            bracketId: bracket._id
        });

        const preservedUserPick = gameDoc.userPick;
        const preservedPickStatus = gameDoc.pickStatus || 'pending';

        gameDoc.teamA = masterGame.teamA;
        gameDoc.teamB = masterGame.teamB;
        gameDoc.scoreA = masterGame.scoreA;
        gameDoc.scoreB = masterGame.scoreB;
        gameDoc.status = masterGame.status;
        gameDoc.round = masterGame.round;
        gameDoc.region = masterGame.region;
        gameDoc.startTime = masterGame.startTime;
        gameDoc.winnerId = masterGame.winnerId;
        gameDoc.winnerName = masterGame.winnerName;
        gameDoc.bracketId = bracket._id;
        gameDoc.userPick = preservedUserPick;
        gameDoc.pickStatus = preservedPickStatus;

        const savedGame = await gameDoc.save();
        syncedGameIds.push(savedGame._id);
    }

    bracket.games = syncedGameIds as any;
    await bracket.save();

    return await bracket.populate('games');
}

function findRequestedPickUpdate(
    game: any,
    requestedUpdates: Map<string, { userPick?: string }>
) {
    const keys = [game._id?.toString?.(), game.id].filter((value): value is string => Boolean(value));

    for (const key of keys) {
        if (requestedUpdates.has(key)) {
            return requestedUpdates.get(key);
        }
    }

    return undefined;
}

/**
 * @swagger
 * /api/brackets:
 *   get:
 *     summary: List all brackets for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const brackets = await Bracket.find({ userId: req.user.id }).populate('games');
        return res.json(brackets);
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/brackets:
 *   post:
 *     summary: Create a new bracket for the authenticated user
 */
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Bracket name is required' });
        }

        if (name.length > 100) {
            return res.status(400).json({ error: 'Bracket name must be less than 100 characters' });
        }

        const bracket = new Bracket({
            ...req.body,
            name: name.trim(),
            userId: req.user.id,
            year: new Date().getFullYear()
        });
        const saved = await bracket.save();
        const syncedBracket = await syncBracketGames(saved);
        return res.status(201).json(syncedBracket);
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/brackets/{id}:
 *   get:
 *     summary: Get a single bracket by ID (must be owned by the authenticated user)
 */
router.get('/:id', validateBracketId, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const bracket = await Bracket.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).populate('games');
        if (!bracket) {
            return res.status(404).json({ error: 'Bracket not found' });
        }

        const syncedBracket = await syncBracketGames(bracket);
        return res.json(syncedBracket);
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/brackets/{id}:
 *   put:
 *     summary: Update picks in a bracket (must be owned by the authenticated user)
 */
router.put('/:id', validateBracketId, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { userId, year, _id, games, ...updates } = req.body;
        const bracket = await Bracket.findOne({
            _id: req.params.id,
            userId: req.user.id
        }).populate('games');

        if (!bracket) {
            return res.status(404).json({ error: 'Bracket not found' });
        }

        await syncBracketGames(bracket);

        if (updates.name !== undefined) {
            if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
                return res.status(400).json({ error: 'Bracket name must be a non-empty string' });
            }
            bracket.name = updates.name.trim();
        }

        if (updates.isPublic !== undefined) {
            if (typeof updates.isPublic !== 'boolean') {
                return res.status(400).json({ error: 'isPublic must be a boolean value' });
            }
            bracket.isPublic = updates.isPublic;
        }

        if (games !== undefined) {
            if (!Array.isArray(games)) {
                return res.status(400).json({ error: 'games must be an array when provided' });
            }

            const requestedUpdates = new Map<string, { userPick?: string }>();
            for (const gameUpdate of games) {
                if (!gameUpdate || typeof gameUpdate !== 'object') {
                    continue;
                }

                const entry = gameUpdate as Record<string, unknown>;
                const lookupKey = typeof entry._id === 'string'
                    ? entry._id
                    : typeof entry.id === 'string'
                        ? entry.id
                        : undefined;

                if (!lookupKey) {
                    continue;
                }

                requestedUpdates.set(lookupKey, {
                    userPick: normalizePickValue(entry.userPick ?? entry.winnerName ?? entry.winnerId)
                });
            }

            for (const game of bracket.games as any[]) {
                const requestedUpdate = findRequestedPickUpdate(game, requestedUpdates);
                if (!requestedUpdate) {
                    continue;
                }

                if (!canEditGamePick(game.status)) {
                    return res.status(400).json({
                        error: `Game ${game.teamA} vs ${game.teamB} is locked and can no longer be edited`
                    });
                }

                if (requestedUpdate.userPick && ![game.teamA, game.teamB].includes(requestedUpdate.userPick)) {
                    return res.status(400).json({
                        error: `Pick for ${game.teamA} vs ${game.teamB} must select one of the participating teams`
                    });
                }
            }

            for (const game of bracket.games as any[]) {
                const requestedUpdate = findRequestedPickUpdate(game, requestedUpdates);
                if (!requestedUpdate) {
                    continue;
                }

                game.userPick = requestedUpdate.userPick;
                game.pickStatus = 'pending';
                await game.save();
            }
        }

        await bracket.save();
        return res.json(await bracket.populate('games'));
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/brackets/{id}:
 *   delete:
 *     summary: Delete a bracket (must be owned by the authenticated user)
 */
router.delete('/:id', validateBracketId, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await Bracket.deleteOne({
            _id: req.params.id,
            userId: req.user.id
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Bracket not found' });
        }
        return res.json({ message: 'Bracket deleted' });
    } catch (error) {
        return handleServerError(res, error);
    }
});

export const bracketRoutes = router;
