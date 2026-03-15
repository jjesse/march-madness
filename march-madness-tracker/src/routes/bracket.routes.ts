/// <reference path="../types/express.d.ts" />
import express from 'express';
import { Bracket } from '../models/bracket';
import { auth } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all bracket routes
router.use(auth);

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
        res.json(brackets);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
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

        const { name, games } = req.body;

        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Bracket name is required' });
        }

        if (name.length > 100) {
            return res.status(400).json({ error: 'Bracket name must be less than 100 characters' });
        }

        const bracket = new Bracket({
            ...req.body,
            userId: req.user.id,
            year: new Date().getFullYear()
        });
        const saved = await bracket.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * @swagger
 * /api/brackets/{id}:
 *   get:
 *     summary: Get a single bracket by ID (must be owned by the authenticated user)
 */
router.get('/:id', async (req, res) => {
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
        res.json(bracket);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * @swagger
 * /api/brackets/{id}:
 *   put:
 *     summary: Update picks in a bracket (must be owned by the authenticated user)
 */
router.put('/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Prevent updating certain fields
        const { userId, year, _id, ...updates } = req.body;

        const bracket = await Bracket.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        ).populate('games');
        if (!bracket) {
            return res.status(404).json({ error: 'Bracket not found' });
        }
        res.json(bracket);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * @swagger
 * /api/brackets/{id}:
 *   delete:
 *     summary: Delete a bracket (must be owned by the authenticated user)
 */
router.delete('/:id', async (req, res) => {
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
        res.json({ message: 'Bracket deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export const bracketRoutes = router;
