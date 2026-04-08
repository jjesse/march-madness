import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/user';

jest.mock('../src/middleware/auth', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'user@example.com', username: 'existing-user', role: 'user' };
    next();
  },
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('signed-jwt'),
}));

jest.mock('../src/models/user', () => ({
  User: jest.fn(),
}));

import { userRoutes } from '../src/routes/user.routes';

describe('user routes', () => {
  const UserMock = User as unknown as jest.Mock & {
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };

  const app = express();
  app.use(express.json());
  app.use('/api/users', userRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    UserMock.findOne = jest.fn();
    UserMock.findById = jest.fn();
    UserMock.findByIdAndUpdate = jest.fn();
    UserMock.mockImplementation((data) => ({
      ...data,
      id: 'user-1',
      save: jest.fn().mockResolvedValue(undefined),
    }));
  });

  test('POST /register validates input', async () => {
    const response = await request(app).post('/api/users/register').send({
      email: 'bad-email',
      username: 'us',
      password: 'weak',
    });

    expect(response.status).toBe(400);
  });

  test('POST /register creates a user for valid input', async () => {
    UserMock.findOne.mockResolvedValue(null);

    const response = await request(app).post('/api/users/register').send({
      email: 'user@example.com',
      username: 'valid-user',
      password: 'StrongPass1',
    });

    expect(response.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass1', expect.any(Number));
  });

  test('POST /login returns a signed token for valid credentials', async () => {
    UserMock.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'valid-user',
        role: 'user',
        password: 'hashed-password',
      }),
    });

    const response = await request(app).post('/api/users/login').send({
      email: 'user@example.com',
      password: 'StrongPass1',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('signed-jwt');
    expect(jwt.sign).toHaveBeenCalled();
  });

  test('GET /profile returns the authenticated user profile', async () => {
    UserMock.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' }),
    });

    const response = await request(app).get('/api/users/profile');

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('user@example.com');
  });

  test('PUT /profile updates profile fields', async () => {
    UserMock.findOne.mockResolvedValue(null);
    UserMock.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ id: 'user-1', username: 'updated-user' }),
    });

    const response = await request(app).put('/api/users/profile').send({
      username: 'updated-user',
    });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('updated-user');
  });

  test('POST /change-password updates the current password', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    UserMock.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        password: 'hashed-password',
        save,
      }),
    });

    const response = await request(app).post('/api/users/change-password').send({
      currentPassword: 'StrongPass1',
      newPassword: 'EvenStronger1',
    });

    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalled();
  });

  test('POST /logout returns a success response', async () => {
    const response = await request(app).post('/api/users/logout');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
  });
});
