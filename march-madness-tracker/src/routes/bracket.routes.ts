import express from 'express';
import { Bracket } from '../models/bracket';

const router = express.Router();

/**
 * @swagger
 * /api/brackets:
 *   get:
 *     summary: List all brackets for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const brackets = await Bracket.find({ userId: req.user!.id }).populate('games');
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
        const bracket = new Bracket({
            ...req.body,
            userId: req.user!.id,
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
        const bracket = await Bracket.findOne({
            _id: req.params.id,
            userId: req.user!.id
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
        const bracket = await Bracket.findOneAndUpdate(
            { _id: req.params.id, userId: req.user!.id },
            req.body,
            { new: true }
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
        const result = await Bracket.deleteOne({
            _id: req.params.id,
            userId: req.user!.id
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
