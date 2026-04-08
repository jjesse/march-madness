import jwt from 'jsonwebtoken';
import { User } from '../src/models/user';
import { auth } from '../src/middleware/auth';
import { preventSQLInjection, sanitizeData, validateJWTHeader } from '../src/middleware/security';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../src/models/user', () => ({
  User: {
    findById: jest.fn(),
  },
}));

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authentication and security middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('auth rejects requests without a bearer token', async () => {
    const req = { header: jest.fn().mockReturnValue(undefined) } as any;
    const res = createMockRes();
    const next = jest.fn();

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('auth attaches the authenticated user for a valid token', async () => {
    const req = { header: jest.fn().mockReturnValue('Bearer valid-token') } as any;
    const res = createMockRes();
    const next = jest.fn();

    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-1' });
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' }),
    });

    await auth(req, res, next);

    expect(req.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(next).toHaveBeenCalled();
  });

  test('sanitizeData removes sensitive fields from the request body', () => {
    const req = { body: { password: 'secret', token: 'jwt', keep: 'value' } } as any;
    const next = jest.fn();

    sanitizeData(req, {} as any, next);

    expect(req.body).toEqual({ keep: 'value' });
    expect(next).toHaveBeenCalled();
  });

  test('preventSQLInjection blocks suspicious payloads', () => {
    const req = { body: { query: 'DROP TABLE users' } } as any;
    const res = createMockRes();
    const next = jest.fn();

    preventSQLInjection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('validateJWTHeader rejects obviously invalid bearer tokens', () => {
    const req = { headers: { authorization: 'Bearer short' } } as any;
    const res = createMockRes();
    const next = jest.fn();

    validateJWTHeader(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
