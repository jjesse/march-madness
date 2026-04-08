process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
