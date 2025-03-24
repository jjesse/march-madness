import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/user';

export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Server error during authentication' });
    }
};
