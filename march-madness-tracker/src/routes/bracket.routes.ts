/// <reference path="../types/express.d.ts" />
import express from 'express';
import mongoose from 'mongoose';
import logger from '../config/logger';
import { Bracket } from '../models/bracket';
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
        return res.status(201).json(saved);
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
        return res.json(bracket);
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

        const { userId, year, _id, ...updates } = req.body;

        if (updates.name !== undefined) {
            if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
                return res.status(400).json({ error: 'Bracket name must be a non-empty string' });
            }
            updates.name = updates.name.trim();
        }

        const bracket = await Bracket.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        ).populate('games');
        if (!bracket) {
            return res.status(404).json({ error: 'Bracket not found' });
        }
        return res.json(bracket);
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
