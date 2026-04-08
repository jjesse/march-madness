import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import logger from '../config/logger';
import { User } from '../models/user';

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later' }
});

function getAdminEmailAllowList(): string[] {
    return (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '').trim();
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.error('JWT_SECRET environment variable is missing during auth verification');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        try {
            const verifyOptions: jwt.VerifyOptions = {
                algorithms: ['HS256']
            };

            if (process.env.JWT_ISSUER) {
                verifyOptions.issuer = process.env.JWT_ISSUER;
            }

            if (process.env.JWT_AUDIENCE) {
                verifyOptions.audience = process.env.JWT_AUDIENCE;
            }

            const decoded = jwt.verify(token, jwtSecret, verifyOptions) as jwt.JwtPayload;

            const user = await User.findById(decoded.id).select('email username role');

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            req.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            };
            return next();
        } catch {
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Server error during authentication' });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdminUser =
        req.user.role === 'admin' ||
        (!!req.user.email && getAdminEmailAllowList().includes(req.user.email.toLowerCase()));

    if (!isAdminUser) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    return next();
};
