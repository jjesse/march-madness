import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { auth } from '../middleware/auth';
import { ValidationError } from '../types/errors';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateEmail(email: string): boolean {
    return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
    return passwordRegex.test(password);
}

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Input validation
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
            });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(400).json({ error: 'Username already exists' });
        }

        const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({ email, username, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login and receive a JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
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
        const expiresIn = process.env.JWT_EXPIRATION || '1h';
        const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                username: user.username 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
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
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
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
        const updates: any = {};

        if (username) {
            if (username.length < 3 || username.length > 30) {
                return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
            }
            // Check if username is already taken by another user
            const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.username = username;
        }

        if (email) {
            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already taken' });
            }
            updates.email = email;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change the authenticated user's password
 */
router.post('/change-password', auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                error: 'New password must be at least 8 characters with uppercase, lowercase, and number' 
            });
        }

        const user = await User.findById(req.user.id);
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

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user (client should discard the JWT token)
 */
router.post('/logout', auth, (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint exists for consistency and potential future server-side token revocation
    res.json({ message: 'Logged out successfully' });
});

export const userRoutes = router;
