import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

// Sensitive data sanitization
export const sanitizeData = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
        delete req.body.password;
        delete req.body.token;
    }
    next();
};

// SQL Injection prevention
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i;
    const testValue = JSON.stringify(req.body);
    
    if (sqlPattern.test(testValue)) {
        return res.status(403).json({ error: 'Potential malicious query detected' });
    }
    next();
};

// JWT Token validation
export const validateJWTHeader = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        if (token.length < 10) {
            return res.status(401).json({ error: 'Invalid token format' });
        }
    }
    next();
};
