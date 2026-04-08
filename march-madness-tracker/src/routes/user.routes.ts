/// <reference path="../types/express.d.ts" />
import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { auth, authRateLimiter } from '../middleware/auth';
import { User } from '../models/user';

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateEmail(email: string): boolean {
    return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
    return passwordRegex.test(password);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function handleServerError(res: Response, error: unknown) {
    logger.error('User route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 */
router.post('/register', authRateLimiter, async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!isNonEmptyString(email) || !isNonEmptyString(username) || !isNonEmptyString(password)) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        const normalizedEmail = normalizeEmail(email);
        const normalizedUsername = username.trim();

        if (!validateEmail(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
            });
        }

        if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
            return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
        }

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with those details already exists' });
        }

        const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({ email: normalizedEmail, username: normalizedUsername, password: hashedPassword });
        await user.save();

        return res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login and receive a JWT token
 */
router.post('/login', authRateLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const tokenOptions: jwt.SignOptions = {
            expiresIn: process.env.JWT_EXPIRATION || '1h',
            algorithm: 'HS256'
        };

        if (process.env.JWT_ISSUER) {
            tokenOptions.issuer = process.env.JWT_ISSUER;
        }

        if (process.env.JWT_AUDIENCE) {
            tokenOptions.audience = process.env.JWT_AUDIENCE;
        }

        const token = jwt.sign({ id: user.id }, jwtSecret, tokenOptions);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 */
router.get('/profile', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(user);
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 */
router.put('/profile', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username, email } = req.body;
        const updates: Record<string, string> = {};

        if (username !== undefined) {
            if (!isNonEmptyString(username)) {
                return res.status(400).json({ error: 'Username must be a non-empty string' });
            }

            const normalizedUsername = username.trim();
            if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
                return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
            }

            const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.username = normalizedUsername;
        }

        if (email !== undefined) {
            if (!isNonEmptyString(email)) {
                return res.status(400).json({ error: 'Email must be a non-empty string' });
            }

            const normalizedEmail = normalizeEmail(email);
            if (!validateEmail(normalizedEmail)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already taken' });
            }
            updates.email = normalizedEmail;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid profile fields provided' });
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(user);
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change the authenticated user's password
 */
router.post('/change-password', auth, authRateLimiter, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from the current password' });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters with uppercase, lowercase, and number'
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        await user.save();

        return res.json({ message: 'Password changed successfully' });
    } catch (error) {
        return handleServerError(res, error);
    }
});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user (client should discard the JWT token)
 */
router.post('/logout', auth, (_req, res) => {
    return res.json({ message: 'Logged out successfully' });
});

export const userRoutes = router;
